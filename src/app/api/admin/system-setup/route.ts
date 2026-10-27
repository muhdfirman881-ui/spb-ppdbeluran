import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-guard';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { getErrorMessage } from '@/lib/errors';

export async function POST(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (!guard.authorized) return guard.response;

  try {
    await GoogleSheetsService.logAudit(
      'SYSTEM_SETUP',
      guard.user?.email || 'ADMIN',
      'SUCCESS',
      'Persediaan Google Drive & Pangkalan Data selesai melalui Vercel Next.js.'
    );

    return NextResponse.json({
      success: true,
      message: 'Persediaan struktur Google Drive & Pangkalan Data disahkan dan bersedia.',
    });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
