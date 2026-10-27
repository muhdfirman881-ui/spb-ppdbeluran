import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-guard';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { getErrorMessage } from '@/lib/errors';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin(request);
  if (!guard.authorized) return guard.response;

  try {
    const { id } = params;
    await GoogleSheetsService.deleteUnit(id);
    return NextResponse.json({ success: true, message: 'Unit berjaya dinyahaktifkan.' });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
