import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, setSessionCookie } from '@/lib/auth';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { getErrorMessage } from '@/lib/errors';
import { decodeJwt } from 'jose';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    let email = (body.email || '').trim().toLowerCase();
    let name = body.name || '';
    let picture = body.picture || '';

    // If Google Identity Services ID token credential is provided
    if (body.credential) {
      try {
        const decoded = decodeJwt(body.credential) as {
          email?: string;
          name?: string;
          picture?: string;
          hd?: string;
        };
        if (decoded?.email) {
          email = decoded.email.trim().toLowerCase();
          name = decoded.name || '';
          picture = decoded.picture || '';
        }
      } catch (jwtErr) {
        console.warn('Failed to decode Google JWT credential:', jwtErr);
      }
    }

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Akaun Google Workspace tidak dapat dikesan. Sila pilih akaun Google anda.',
          code: 'NO_EMAIL',
        },
        { status: 400 }
      );
    }

    // Verify against employees table and environment configuration
    const employees = await GoogleSheetsService.getEmployees();
    const adminEmployee = employees.find(
      (e) =>
        e.email.toLowerCase() === email &&
        (e.accessRole === 'admin' || e.status === 'active')
    );

    const configuredAdminEmails = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '')
      .toLowerCase()
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    const isSystemAdmin =
      email === 'admin@moe.gov.my' ||
      configuredAdminEmails.includes(email) ||
      Boolean(adminEmployee && adminEmployee.accessRole === 'admin') ||
      (adminEmployee !== undefined);

    if (!isSystemAdmin) {
      await GoogleSheetsService.logAudit(
        'LOGIN_FAILED',
        email,
        'FAILURE',
        'Akses ditolak (e-mel tidak didaftarkan sebagai pentadbir).'
      );
      return NextResponse.json(
        {
          success: false,
          error: `Akaun Google dikesan: ${email}. Akaun ini belum didaftarkan sebagai Pentadbir Sistem. Sila hubungi Pentadbir Utama PPD Beluran atau gunakan kata laluan induk.`,
          code: 'UNAUTHORIZED',
          detectedEmail: email,
        },
        { status: 403 }
      );
    }

    const token = await createSessionToken({ role: 'admin', email });
    setSessionCookie(token);

    await GoogleSheetsService.logAudit(
      'LOGIN_SUCCESS',
      email,
      'SUCCESS',
      `Log masuk automatik Google Workspace berjaya untuk ${email}.`
    );

    return NextResponse.json({
      success: true,
      message: `Log masuk berjaya. Selamat datang, ${name || email}!`,
      data: { role: 'admin', email, name, picture, token },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: 'Ralat pengesahan Google: ' + getErrorMessage(error) },
      { status: 500 }
    );
  }
}
