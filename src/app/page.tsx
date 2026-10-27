import { GoogleSheetsService } from '@/lib/google-sheets';
import { getPublicPortalMeta } from '@/lib/config';
import { PortalHome } from '@/components/PortalHome';
import { InitialPortalData } from '@/types';

// Incremental Static Regeneration (ISR) - cached at CDN/server edge, revalidated in background
export const revalidate = 180;

export default async function HomePage() {
  const { heroAlbum, announcements, units, categories, quickAccess } =
    await GoogleSheetsService.getBatchPortalData();

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
