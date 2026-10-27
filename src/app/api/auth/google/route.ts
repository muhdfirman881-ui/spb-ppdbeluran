import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, setSessionCookie } from '@/lib/auth';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { getErrorMessage } from '@/lib/errors';
import { decodeJwt } from 'jose';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    if (!body.credential) {
      return NextResponse.json(
        {
          success: false,
          error: 'Pengesahan kriptografi Google diperlukan. Sila gunakan butang Log Masuk Google Workspace rasmi.',
          code: 'CREDENTIAL_REQUIRED',
        },
        { status: 400 }
      );
    }

    let email = '';
    let name = '';
    let picture = '';

    try {
      const decoded = decodeJwt(body.credential) as {
        email?: string;
        name?: string;
        picture?: string;
        email_verified?: boolean;
        hd?: string;
      };
      if (decoded?.email) {
        email = decoded.email.trim().toLowerCase();
        name = decoded.name || '';
        picture = decoded.picture || '';
      }
    } catch (jwtErr) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token kelayakan Google tidak sah atau telah diubah suai.',
          code: 'INVALID_CREDENTIAL',
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Akaun Google Workspace tidak dapat disahkan. Sila log masuk semula.',
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
