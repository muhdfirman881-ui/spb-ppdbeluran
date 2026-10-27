import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-guard';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { EmployeeSchema } from '@/lib/validation';
import { getErrorMessage } from '@/lib/errors';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (!guard.authorized) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const unitId = searchParams.get('unitId') || undefined;
    const employees = await GoogleSheetsService.getEmployees(unitId);
    return NextResponse.json({ success: true, data: employees });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (!guard.authorized) return guard.response;

  try {
    const body = await request.json();
    const validated = EmployeeSchema.parse(body);
    const saved = await GoogleSheetsService.saveEmployee(validated);
    return NextResponse.json({ success: true, data: saved, message: 'Maklumat pegawai berjaya disimpan.' });
  } catch (error: unknown) {
    const errorMsg =
      error instanceof z.ZodError ? error.errors[0]?.message : getErrorMessage(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
  }
}
