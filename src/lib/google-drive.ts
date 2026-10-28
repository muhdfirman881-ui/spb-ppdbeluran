import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';
import { AppConfig } from './config';

export class GoogleDriveService {
  private static driveApi: drive_v3.Drive | null = null;

  private static isConfigured(): boolean {
    return Boolean(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY
    );
  }

  public static getClient(): drive_v3.Drive | null {
    if (!this.isConfigured()) return null;

    if (!this.driveApi) {
      const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
      let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      privateKey = privateKey.replace(/\\n/g, '\n');

      const auth = new google.auth.JWT({
        email,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });

      this.driveApi = google.drive({ version: 'v3', auth });
    }

    return this.driveApi;
  }

  static async uploadBase64File(payload: {
    data: string; // Base64 data (with or without data URI prefix)
    fileName: string;
    contentType: string;
    folderId?: string;
  }): Promise<{
    fileId: string;
    fileName: string;
    fileSize: number;
    sizeFormatted: string;
    viewUrl: string;
    directUrl: string;
    thumbUrl: string;
  }> {
    const raw = payload.data.includes(',') ? payload.data.split(',')[1] : payload.data;
    const buffer = Buffer.from(raw, 'base64');
    const fileSize = buffer.length;
    const sizeFormatted =
      fileSize > 1048576
        ? (fileSize / 1048576).toFixed(1) + ' MB'
        : (fileSize / 1024).toFixed(0) + ' KB';

    const drive = this.getClient();
    if (!drive) {
      const mockId = `DRIVE_FILE_${Date.now()}`;
      return {
        fileId: mockId,
        fileName: payload.fileName,
        fileSize,
        sizeFormatted,
        viewUrl: `https://drive.google.com/file/d/${mockId}/preview`,
        directUrl: `https://drive.google.com/uc?export=download&id=${mockId}`,
        thumbUrl: payload.contentType.startsWith('image/')
          ? `data:${payload.contentType};base64,${raw}`
          : `https://drive.google.com/thumbnail?id=${mockId}&sz=w600`,
      };
    }

    const stream = Readable.from(buffer);

    const folderId = payload.folderId || AppConfig.DRIVE_ROOT_FOLDER_ID;
    const parents = folderId ? [folderId] : undefined;

    const res = await drive.files.create({
      requestBody: {
        name: payload.fileName,
        mimeType: payload.contentType,
        parents,
      },
      media: {
        mimeType: payload.contentType,
        body: stream,
      },
      fields: 'id, name, mimeType, size',
    });

    const fileId = res.data.id || `DRIVE_FILE_${Date.now()}`;

    // Set permission to anyone with link can view
    try {
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
    } catch (permErr) {
      console.warn('Drive permission set warning:', permErr);
    }

    return {
      fileId,
      fileName: payload.fileName,
      fileSize,
      sizeFormatted,
      viewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      directUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
      thumbUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w600`,
    };
  }

  static async getFileData(fileId: string) {
    if (!fileId) throw new Error('ID fail tidak sah.');

    const drive = this.getClient();
    if (!drive) {
      return {
        fileId,
        fileName: 'Fail Simulasi',
        mimeType: 'application/pdf',
        size: 1024000,
        isImage: false,
        isPdf: true,
        tooLarge: false,
        previewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        directUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
        dataUri: null,
      };
    }

    try {
      const meta = await drive.files.get({
        fileId,
        fields: 'id, name, mimeType, size',
      });

      const mime = meta.data.mimeType || '';
      const name = meta.data.name || '';
      const size = Number(meta.data.size) || 0;
      const isImage = mime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name);
      const isPdf = mime === 'application/pdf' || /\.pdf$/i.test(name);
      const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
      const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

      // Max size for base64 transfer (8MB)
      if (size > 8 * 1024 * 1024) {
        return {
          fileId,
          fileName: name,
          mimeType: mime,
          size,
          isImage,
          isPdf,
          tooLarge: true,
          dataUri: null,
          previewUrl,
          directUrl,
        };
      }

      if (isImage || isPdf) {
        const fileRes = await drive.files.get(
          { fileId, alt: 'media' },
          { responseType: 'arraybuffer' }
        );
        const b64 = Buffer.from(fileRes.data as ArrayBuffer).toString('base64');
        return {
          fileId,
          fileName: name,
          mimeType: mime,
          size,
          isImage,
          isPdf,
          tooLarge: false,
          base64: b64,
          dataUri: `data:${mime};base64,${b64}`,
          previewUrl,
          directUrl,
        };
      }

      return {
        fileId,
        fileName: name,
        mimeType: mime,
        size,
        isImage: false,
        isPdf: false,
        tooLarge: false,
        dataUri: null,
        previewUrl,
        directUrl,
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error('Gagal memuatkan data fail Google Drive: ' + msg);
    }
  }

  static async listFolderFiles(folderId: string) {
    const drive = this.getClient();
    if (!drive || !folderId) return [];

    try {
      const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType, size)',
      });

      return (res.data.files || []).map((f) => ({
        id: f.id || '',
        name: f.name || '',
        mimeType: f.mimeType || '',
        size: Number(f.size) || 0,
        viewUrl: `https://drive.google.com/file/d/${f.id}/preview`,
        directUrl: `https://drive.google.com/uc?export=download&id=${f.id}`,
      }));
    } catch {
      return [];
    }
  }
}
