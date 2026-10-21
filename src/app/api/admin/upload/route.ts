import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-guard';
import { GoogleDriveService } from '@/lib/google-drive';
import { getErrorMessage } from '@/lib/errors';

export async function POST(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (!guard.authorized) return guard.response;

  try {
    const body = await request.json();
    const { data, fileName, contentType, folderId } = body;

    if (!data) {
      return NextResponse.json({ success: false, error: 'Tiada data fail.' }, { status: 400 });
    }

    const uploaded = await GoogleDriveService.uploadBase64File({
      data,
      fileName: fileName || `espb_upload_${Date.now()}`,
      contentType: contentType || 'application/octet-stream',
      folderId,
    });

    return NextResponse.json({
      success: true,
      data: uploaded,
      message: 'Fail berjaya dimuat naik ke Google Drive.',
    });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
