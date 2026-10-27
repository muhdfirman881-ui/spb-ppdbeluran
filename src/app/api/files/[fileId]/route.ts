import { NextRequest, NextResponse } from 'next/server';
import { GoogleDriveService } from '@/lib/google-drive';
import { getErrorMessage } from '@/lib/errors';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';

function createFallbackPdf(title: string, subtitle?: string): Buffer {
  const cleanTitle = (title || 'Dokumen Rasmi').replace(/[\r\n()]/g, ' ').slice(0, 80);
  const cleanSub = (subtitle || 'Sektor Pembelajaran PPD Beluran').replace(/[\r\n()]/g, ' ').slice(0, 80);
  const content = `BT
/F1 18 Tf
50 720 Td
(${cleanTitle}) Tj
/F1 12 Tf
0 -30 Td
(${cleanSub}) Tj
0 -25 Td
(Pratonton Dokumen - Sektor Pembelajaran PPD Beluran) Tj
0 -20 Td
(Dokumen boleh dimuat turun melalui butang Muat Turun di atas.) Tj
ET`;
  const streamLength = Buffer.byteLength(content);
  const body = [
    '%PDF-1.4',
    '1 0 obj',
    '<< /Type /Catalog /Pages 2 0 R >>',
    'endobj',
    '2 0 obj',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    'endobj',
    '3 0 obj',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    'endobj',
    '4 0 obj',
    `<< /Length ${streamLength} >>`,
    'stream',
    content,
    'endstream',
    'endobj',
    '5 0 obj',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    'endobj',
  ].join('\n');

  const pdf = `${body}
xref
0 6
0000000000 65535 f 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${body.length}
%%EOF`;
  return Buffer.from(pdf);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;
    if (!fileId) {
      return new NextResponse('File ID diperlukan', { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const isDownload = searchParams.get('download') === 'true';
    const isInfo = searchParams.get('info') === 'true' || searchParams.get('json') === 'true';

    // If client specifically requests JSON file metadata
    if (isInfo) {
      const fileData = await GoogleDriveService.getFileData(fileId);
      return NextResponse.json({ success: true, data: fileData });
    }

    const drive = GoogleDriveService.getClient();

    if (drive) {
      try {
        // Fetch Drive metadata
        let fileName = `${fileId}.pdf`;
        let mimeType = 'application/pdf';
        let fileSize: number | undefined;

        try {
          const meta = await drive.files.get({
            fileId,
            fields: 'id, name, mimeType, size',
          });
          if (meta.data.name) fileName = meta.data.name;
          if (meta.data.mimeType) mimeType = meta.data.mimeType;
          if (meta.data.size) fileSize = Number(meta.data.size);
        } catch (metaErr) {
          console.warn('Drive meta warning for file:', fileId, metaErr);
        }

        // If file extension suggests PDF, enforce application/pdf
        if (/\.pdf$/i.test(fileName)) {
          mimeType = 'application/pdf';
        }

        // Stream binary media from Google Drive
        const mediaRes = await drive.files.get(
          { fileId, alt: 'media' },
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

        const disposition = isDownload ? 'attachment' : 'inline';
        const headers: Record<string, string> = {
          'Content-Type': mimeType,
          'Content-Disposition': `${disposition}; filename="${encodeURIComponent(fileName)}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          'Accept-Ranges': 'bytes',
        };

        if (fileSize && fileSize > 0) {
          headers['Content-Length'] = String(fileSize);
        }

        return new NextResponse(webStream, { headers });
      } catch (streamErr) {
        console.warn('Drive stream failed for', fileId, streamErr);
      }
    }

    // Fallback: Generate a clean, valid PDF buffer for mock or inaccessible files
    const fallbackBuf = createFallbackPdf(
      `Dokumen E-SPb Beluran (${fileId.slice(0, 10)})`,
      'Sektor Pembelajaran Pejabat Pendidikan Daerah Beluran'
    );

    const disposition = isDownload ? 'attachment' : 'inline';
    return new NextResponse(new Uint8Array(fallbackBuf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="Dokumen_${fileId}.pdf"`,
        'Content-Length': String(fallbackBuf.length),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: unknown) {
    console.error('File route error:', error);
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
