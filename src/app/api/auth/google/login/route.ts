import { NextRequest, NextResponse } from 'next/server';

function getBaseUrl(request: NextRequest): string {
  // 1. Prioritize x-forwarded-host because it is the exact domain the user visited in their browser
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost) {
    const host = forwardedHost.split(',')[0].trim();
    return `${forwardedProto}://${host}`;
  }

  // 2. If explicit production app URL is set
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl.replace(/\/$/, '');
  }

  return request.nextUrl.origin;
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

export async function GET(request: NextRequest) {
  const { clientId } = getOAuthCredentials();
  const baseUrl = getBaseUrl(request);

  if (!clientId) {
    return NextResponse.redirect(
      new URL('/?auth_error=oauth_not_configured', baseUrl)
    );
  }

  // Generate cryptographically secure random state token to prevent CSRF attacks
  const state = crypto.randomUUID();
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  // Build Google OAuth 2.0 authorization URL
  const loginHint = request.nextUrl.searchParams.get('login_hint');
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('state', state);
  googleAuthUrl.searchParams.set('access_type', 'online');
  googleAuthUrl.searchParams.set('prompt', 'select_account');
  googleAuthUrl.searchParams.set('hd', 'moe.gov.my');
  if (loginHint) {
    googleAuthUrl.searchParams.set('login_hint', loginHint);
  }

  const response = NextResponse.redirect(googleAuthUrl.toString());

  // Store state token in an HTTP-only cookie valid for 10 minutes
  response.cookies.set('espb_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return response;
}
