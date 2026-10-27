import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-guard';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { AnnouncementSchema } from '@/lib/validation';
import { getErrorMessage } from '@/lib/errors';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (!guard.authorized) return guard.response;

  try {
    const data = await GoogleSheetsService.getAnnouncements();
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (!guard.authorized) return guard.response;

  try {
    const body = await request.json();
    const validated = AnnouncementSchema.parse(body);
    const saved = await GoogleSheetsService.saveAnnouncement(validated);
    return NextResponse.json({ success: true, data: saved, message: 'Hebahan berjaya disimpan.' });
  } catch (error: unknown) {
    const errorMsg =
      error instanceof z.ZodError ? error.errors[0]?.message : getErrorMessage(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
  }
}
