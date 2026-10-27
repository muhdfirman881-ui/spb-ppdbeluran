import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken } from '@/lib/auth';
import { AppConfig } from '@/lib/config';
import { GoogleSheetsService } from '@/lib/google-sheets';

function getBaseUrl(request: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl.replace(/\/$/, '');
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost) {
    const host = forwardedHost.split(',')[0].trim();
    return `${forwardedProto}://${host}`;
  }
  return request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request);
  const searchParams = request.nextUrl.searchParams;

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // 1. Check for OAuth errors returned by Google
  if (error) {
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent(error)}`, baseUrl)
    );
  }

  // 2. Validate authorization code
  if (!code) {
    return NextResponse.redirect(
      new URL('/?auth_error=no_code', baseUrl)
    );
  }

  // 3. Verify CSRF state token
  const storedState = request.cookies.get('espb_oauth_state')?.value;
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(
      new URL('/?auth_error=csrf_failed', baseUrl)
    );
  }

function getOAuthCredentials() {
  let clientId =
    process.env.GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  let clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    try {
      const fs = require('fs');
      const path = require('path');
      const envPath = path.resolve(process.cwd(), '.env.local');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const matchId = content.match(/GOOGLE_CLIENT_ID=["']?([^"'\r\n]+)["']?/);
        const matchSecret = content.match(/GOOGLE_CLIENT_SECRET=["']?([^"'\r\n]+)["']?/);
        if (matchId && matchId[1]) clientId = matchId[1].trim();
        if (matchSecret && matchSecret[1]) clientSecret = matchSecret[1].trim();
      }
    } catch {}
  }

  return { clientId, clientSecret };
}

  // 4. Retrieve OAuth credentials
  const { clientId, clientSecret } = getOAuthCredentials();
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL('/?auth_error=oauth_not_configured', baseUrl)
    );
  }

  try {
    // 5. Exchange authorization code for tokens directly with Google's OAuth 2.0 endpoint
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Google token exchange error:', tokenData);
      return NextResponse.redirect(
        new URL('/?auth_error=token_exchange_failed', baseUrl)
      );
    }

    // 6. Fetch verified user identity from Google's OpenID UserInfo API
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userInfo = await userInfoRes.json();
    const verifiedEmail = (userInfo.email || '').trim().toLowerCase();
    const isEmailVerified = Boolean(userInfo.email_verified);
    const fullName = userInfo.name || '';
    const avatarUrl = userInfo.picture || '';

    if (!verifiedEmail || !isEmailVerified) {
      return NextResponse.redirect(
        new URL('/?auth_error=unverified_email', baseUrl)
      );
    }

    // 7. Verify whether this email is an authorized administrator
    // Checks live Google Sheets Employees directory
    const employees = await GoogleSheetsService.getEmployees();
    const adminEmployee = employees.find(
      (e) =>
        e.email.toLowerCase() === verifiedEmail &&
        (e.accessRole === 'admin' || e.status === 'active')
    );

    const configuredAdminEmails = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '')
      .toLowerCase()
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    const isSystemAdmin =
      verifiedEmail === 'admin@moe.gov.my' ||
      configuredAdminEmails.includes(verifiedEmail) ||
      Boolean(adminEmployee && adminEmployee.accessRole === 'admin') ||
      (adminEmployee !== undefined);

    if (!isSystemAdmin) {
      await GoogleSheetsService.logAudit(
        'LOGIN_UNAUTHORIZED',
        verifiedEmail,
        'FAILURE',
        `Akses ditolak: ${verifiedEmail} disahkan Google tetapi bukan pentadbir berdaftar.`
      );

      const redirect = NextResponse.redirect(
        new URL(
          `/?auth_error=unauthorized&email=${encodeURIComponent(verifiedEmail)}`,
          baseUrl
        )
      );
      // Clean up state cookie
      redirect.cookies.delete('espb_oauth_state');
      return redirect;
    }

    // 8. Generate sovereign admin session token
    const token = await createSessionToken({
      role: 'admin',
      email: verifiedEmail,
    });

    await GoogleSheetsService.logAudit(
      'LOGIN_SUCCESS_GOOGLE_OAUTH',
      verifiedEmail,
      'SUCCESS',
      `Log masuk rasmi Google OAuth 2.0 disahkan untuk ${verifiedEmail} (${fullName || 'Pegawai'}).`
    );

    // 9. Redirect to Admin Dashboard with session cookie set
    const response = NextResponse.redirect(new URL('/admin', baseUrl));

    const maxAge = (AppConfig.SESSION_DURATION_HOURS || 4) * 3600;
    response.cookies.set('espb_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
      path: '/',
    });

    // Clean up CSRF state cookie
    response.cookies.delete('espb_oauth_state');

    return response;
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(
      new URL('/?auth_error=oauth_internal_error', baseUrl)
    );
  }
}
