import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-guard';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { UnitSchema } from '@/lib/validation';
import { getErrorMessage } from '@/lib/errors';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (!guard.authorized) return guard.response;

  try {
    const units = await GoogleSheetsService.getUnits();
    const documents = await GoogleSheetsService.getDocuments();

    // Attach document counts
    const enriched = units.map((u) => ({
      ...u,
      docsCount: documents.filter((d) => d.unitId === u.unitId).length,
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (!guard.authorized) return guard.response;

  try {
    const body = await request.json();
    const validated = UnitSchema.parse(body);
    const saved = await GoogleSheetsService.saveUnit(validated);
    return NextResponse.json({ success: true, data: saved, message: 'Unit berjaya disimpan.' });
  } catch (error: unknown) {
    const errorMsg =
      error instanceof z.ZodError ? error.errors[0]?.message : getErrorMessage(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
  }
}
