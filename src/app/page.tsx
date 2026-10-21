import { GoogleSheetsService } from '@/lib/google-sheets';
import { getPublicPortalMeta } from '@/lib/config';
import { PortalHome } from '@/components/PortalHome';
import { InitialPortalData } from '@/types';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [heroAlbum, announcements, units, categories, quickAccess] = await Promise.all([
    GoogleSheetsService.getHeroAlbum(),
    GoogleSheetsService.getAnnouncements(6),
    GoogleSheetsService.getUnits(),
    GoogleSheetsService.getCategories(),
    GoogleSheetsService.getQuickAccess(),
  ]);

  const unitsHierarchy = categories.map((cat) => ({
    category: cat,
    units: units.filter((u) => u.categoryId === cat.categoryId),
  }));

  const initialData: InitialPortalData = {
    heroAlbum,
    announcements,
    unitsHierarchy,
    quickAccess,
    unitRegistry: units,
    navigationData: {
      categories,
      units,
    },
    meta: getPublicPortalMeta(),
  };

  return <PortalHome initialData={initialData} />;
}
