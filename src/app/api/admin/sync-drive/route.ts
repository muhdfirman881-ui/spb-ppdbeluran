import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-guard';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { GoogleDriveService } from '@/lib/google-drive';
import { getErrorMessage } from '@/lib/errors';

export async function POST(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (!guard.authorized) return guard.response;

  try {
    const units = await GoogleSheetsService.getUnits();
    const existingDocs = await GoogleSheetsService.getDocuments();
    const existingFileIds = new Set(existingDocs.map((d) => d.fileId));
    let syncedCount = 0;

    for (const unit of units) {
      if (unit.driveFolderId) {
        const driveFiles = await GoogleDriveService.listFolderFiles(unit.driveFolderId);
        for (const file of driveFiles) {
          if (!existingFileIds.has(file.id)) {
            let cat = 'Dokumen';
            if (/borang/i.test(file.name)) cat = 'Borang';
            else if (/panduan|instrumen/i.test(file.name)) cat = 'Panduan';
            else if (/laporan|manual/i.test(file.name)) cat = 'Laporan';
            else if (/dskp|kurikulum/i.test(file.name)) cat = 'DSKP';
            else if (/modul/i.test(file.name)) cat = 'Modul';

            const fileSizeFormatted =
              file.size > 1048576
                ? (file.size / 1048576).toFixed(1) + ' MB'
                : (file.size / 1024).toFixed(0) + ' KB';

            await GoogleSheetsService.saveDocument({
              unitId: unit.unitId,
              title: file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
              description: `Dokumen automatik diselaraskan daripada folder Google Drive ${unit.unitName}`,
              fileId: file.id,
              fileName: file.name,
              fileType: file.mimeType.includes('pdf') ? 'pdf' : 'doc',
              fileSize: fileSizeFormatted,
              category: cat,
              status: 'active',
              displayOrder: 99,
            });
            syncedCount++;
          }
        }
      }
    }

    await GoogleSheetsService.logAudit(
      'SYNC_DRIVE_FILES',
      'ADMIN',
      'SUCCESS',
      `Penyelarasan selesai. ${syncedCount} fail baharu ditambah.`
    );

    return NextResponse.json({
      success: true,
      message: `Penyelarasan Google Drive selesai. ${syncedCount} fail baharu diselaraskan ke dalam pangkalan data.`,
      data: { syncedCount },
    });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
