import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-guard';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { UnitContentSchema } from '@/lib/validation';
import { getErrorMessage } from '@/lib/errors';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (!guard.authorized) return guard.response;

  try {
    const body = await request.json();
    const validated = UnitContentSchema.parse(body);
    const saved = await GoogleSheetsService.saveUnitContent(validated);
    return NextResponse.json({ success: true, data: saved, message: 'Kandungan unit berjaya disimpan.' });
  } catch (error: unknown) {
    const errorMsg =
      error instanceof z.ZodError ? error.errors[0]?.message : getErrorMessage(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
  }
}
