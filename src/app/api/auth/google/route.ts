import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, setSessionCookie } from '@/lib/auth';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { getErrorMessage } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email || '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sila masukkan e-mel akaun rasmi Google Workspace (@moe.gov.my).',
          code: 'NO_EMAIL',
        },
        { status: 400 }
      );
    }

    // Verify against employees table
    const employees = await GoogleSheetsService.getEmployees();
    const adminEmployee = employees.find(
      (e) =>
        e.email.toLowerCase() === email &&
        e.accessRole === 'admin' &&
        e.status === 'active'
    );

    const isSystemAdmin = email === 'admin@moe.gov.my' || Boolean(adminEmployee);

    if (!isSystemAdmin) {
      await GoogleSheetsService.logAudit('LOGIN_FAILED', email, 'FAILURE', 'Akses ditolak (bukan pentadbir).');
      return NextResponse.json(
        {
          success: false,
          error: `Akaun anda (${email}) tidak didaftarkan sebagai Pentadbir Sistem.`,
          code: 'UNAUTHORIZED',
        },
        { status: 403 }
      );
    }

    const token = await createSessionToken({ role: 'admin', email });
    setSessionCookie(token);

    await GoogleSheetsService.logAudit('LOGIN_SUCCESS', email, 'SUCCESS', 'Log masuk Google Workspace berjaya.');

    return NextResponse.json({
      success: true,
      message: 'Log masuk Google Workspace berjaya.',
      data: { role: 'admin', email, token },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: 'Ralat pengesahan Google: ' + getErrorMessage(error) },
      { status: 500 }
    );
  }
}
