import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-guard';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { getErrorMessage } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (!guard.authorized) return guard.response;

  try {
    const info = await GoogleSheetsService.getSystemInfo();
    return NextResponse.json({ success: true, data: info });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
