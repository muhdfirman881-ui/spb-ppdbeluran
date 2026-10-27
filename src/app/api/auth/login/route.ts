import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, recordFailedAttempt, clearRateLimit, createSessionToken, setSessionCookie } from '@/lib/auth';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { LoginSchema } from '@/lib/validation';
import { getErrorMessage } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rate = checkRateLimit(ip);

    if (!rate.allowed) {
      const waitMins = Math.ceil(((rate.lockedUntil || Date.now()) - Date.now()) / 60000);
      return NextResponse.json(
        {
          success: false,
          error: `Akaun disekat sementara (${waitMins} minit lagi) akibat percubaan gagal berulang.`,
          code: 'ACCOUNT_LOCKED',
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parseResult = LoginSchema.safeParse(body);

    if (!parseResult.success) {
      recordFailedAttempt(ip);
      return NextResponse.json(
        { success: false, error: 'Sila masukkan kata laluan.' },
        { status: 400 }
      );
    }

    const { passphrase } = parseResult.data;
    const expectedPassphrase = process.env.ADMIN_PASSPHRASE || 'espb_admin_beluran_2026!';

    if (passphrase.trim() !== expectedPassphrase.trim()) {
      recordFailedAttempt(ip);
      const updatedRate = checkRateLimit(ip);
      await GoogleSheetsService.logAudit('LOGIN_FAILED', 'ADMIN', 'FAILURE', 'Kata laluan pentadbir tidak sah.');
      return NextResponse.json(
        {
          success: false,
          error: `Kata laluan tidak sah. Baki percubaan: ${updatedRate.remaining}`,
          code: 'INVALID_CREDENTIALS',
        },
        { status: 401 }
      );
    }

    clearRateLimit(ip);
    const token = await createSessionToken({ role: 'admin', email: 'admin@moe.gov.my' });
    setSessionCookie(token);

    await GoogleSheetsService.logAudit('LOGIN_SUCCESS', 'ADMIN', 'SUCCESS', 'Log masuk berjaya menggunakan kata laluan.');

    return NextResponse.json({
      success: true,
      message: 'Log masuk berjaya.',
      data: { role: 'admin', token },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: 'Ralat pelayan: ' + getErrorMessage(error) },
      { status: 500 }
    );
  }
}
