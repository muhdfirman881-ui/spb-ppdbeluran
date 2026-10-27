import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-guard';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { DocumentSchema } from '@/lib/validation';
import { getErrorMessage } from '@/lib/errors';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (!guard.authorized) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const unitId = searchParams.get('unitId') || undefined;
    const documents = await GoogleSheetsService.getDocuments(unitId);
    return NextResponse.json({ success: true, data: documents });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (!guard.authorized) return guard.response;

  try {
    const body = await request.json();
    const validated = DocumentSchema.parse(body);
    const saved = await GoogleSheetsService.saveDocument(validated);
    return NextResponse.json({ success: true, data: saved, message: 'Dokumen berjaya disimpan.' });
  } catch (error: unknown) {
    const errorMsg =
      error instanceof z.ZodError ? error.errors[0]?.message : getErrorMessage(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
  }
}
