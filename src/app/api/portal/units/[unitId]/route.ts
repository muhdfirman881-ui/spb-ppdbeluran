import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { getErrorMessage } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { unitId: string } }
) {
  try {
    const { unitId } = params;
    const units = await GoogleSheetsService.getUnits();
    const unit = units.find((u) => u.unitId.toLowerCase() === unitId.toLowerCase());

    if (!unit) {
      return NextResponse.json(
        { success: false, error: 'Unit tidak ditemui.' },
        { status: 404 }
      );
    }

    const [content, employees, documents] = await Promise.all([
      GoogleSheetsService.getUnitContent(unit.unitId),
      GoogleSheetsService.getEmployees(unit.unitId),
      GoogleSheetsService.getDocuments(unit.unitId),
    ]);

    const responsibilities = content
      .filter((c) => c.sectionType === 'responsibility' && c.status === 'active')
      .map((c) => c.title);

    const services = content
      .filter((c) => c.sectionType === 'service' && c.status === 'active')
      .map((c) => c.title);

    const customContent = content.filter(
      (c) => c.sectionType !== 'responsibility' && c.sectionType !== 'service' && c.status === 'active'
    );

    return NextResponse.json({
      success: true,
      data: {
        unit,
        responsibilities,
        services,
        customContent,
        employees,
        documents,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: 'Gagal memuatkan unit: ' + getErrorMessage(error) },
      { status: 500 }
    );
  }
}
