import { NextRequest, NextResponse } from 'next/server';
import { GoogleDriveService } from '@/lib/google-drive';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;
    if (!fileId) {
      return new NextResponse('File ID required', { status: 400 });
    }

    const drive = GoogleDriveService.getClient();

    if (drive) {
      try {
        let mimeType = 'image/jpeg';
        try {
          const meta = await drive.files.get({
            fileId,
            fields: 'mimeType',
            supportsAllDrives: true,
          });
          if (meta.data.mimeType) {
            mimeType = meta.data.mimeType;
          }
        } catch (_) {}

        // Stream image media directly from Drive
        const mediaRes = await drive.files.get(
          { fileId, alt: 'media', supportsAllDrives: true },
          { responseType: 'stream' }
        );

        const nodeStream = mediaRes.data as Readable;
        const webStream = new ReadableStream({
          start(controller) {
            nodeStream.on('data', (chunk) => controller.enqueue(chunk));
            nodeStream.on('end', () => controller.close());
            nodeStream.on('error', (err) => controller.error(err));
          },
        });

        return new NextResponse(webStream, {
          headers: {
            'Content-Type': mimeType,
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          },
        });
      } catch (driveErr) {
        console.warn('Drive direct stream failed, attempting direct Google user content fetch for', fileId, driveErr);
      }
    }

    // Fallback: fetch directly from Google UserContent or thumbnail without Referer
    const directRes = await fetch(`https://lh3.googleusercontent.com/d/${fileId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (directRes.ok) {
      const buffer = await directRes.arrayBuffer();
      const contentType = directRes.headers.get('content-type') || 'image/jpeg';
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      });
    }

    // Secondary fallback: Google thumbnail service
    const thumbRes = await fetch(`https://drive.google.com/thumbnail?id=${fileId}&sz=w1920`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (thumbRes.ok) {
      const buffer = await thumbRes.arrayBuffer();
      const contentType = thumbRes.headers.get('content-type') || 'image/jpeg';
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      });
    }

    return new NextResponse('Image not found', { status: 404 });
  } catch (error: any) {
    console.error('Image proxy error for', params.fileId, error?.message);
    return new NextResponse('Image proxy error', { status: 500 });
  }
}
