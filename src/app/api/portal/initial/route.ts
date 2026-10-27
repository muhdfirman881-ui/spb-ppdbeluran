import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { getPublicPortalMeta } from '@/lib/config';
import { getErrorMessage } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [heroAlbum, announcements, units, categories, quickAccess, settings] = await Promise.all([
      GoogleSheetsService.getHeroAlbum(),
      GoogleSheetsService.getAnnouncements(6),
      GoogleSheetsService.getUnits(),
      GoogleSheetsService.getCategories(),
      GoogleSheetsService.getQuickAccess(),
      GoogleSheetsService.getSettings(),
    ]);

    // Build hierarchy
    const unitsHierarchy = categories.map((cat) => ({
      category: cat,
      units: units.filter((u) => u.categoryId === cat.categoryId),
    }));

    const meta = getPublicPortalMeta();
    if (settings.CARTA_ORGANISASI_URL) {
      meta.cartaOrganisasiUrl = settings.CARTA_ORGANISASI_URL;
    }

    return NextResponse.json({
      success: true,
      data: {
        heroAlbum,
        announcements,
        unitsHierarchy,
        quickAccess,
        unitRegistry: units,
        navigationData: {
          categories,
          units,
        },
        meta,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: 'Gagal memuatkan data portal: ' + getErrorMessage(error) },
      { status: 500 }
    );
  }
}
