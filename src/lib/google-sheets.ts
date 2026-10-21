import { google, sheets_v4 } from 'googleapis';
import { AppConfig } from './config';
import { sanitizeString } from './validation';
import {
  initialUnits,
  initialCategories,
  initialUnitContent,
  initialEmployees,
  initialDocuments,
  initialHeroSlides,
  initialAnnouncements,
  initialQuickAccess,
} from './mock-data';
import {
  Unit,
  UnitCategory,
  UnitContent,
  Employee,
  DocumentRecord,
  HeroSlide,
  Announcement,
  AuditLogEntry,
  QuickAccessService,
  SystemInfo,
} from '@/types';

// In-Memory store as reliable fallback when Google Service Account is not supplied
class MemoryDatabase {
  units: Unit[] = [...initialUnits];
  categories: UnitCategory[] = [...initialCategories];
  content: UnitContent[] = [...initialUnitContent];
  employees: Employee[] = [...initialEmployees];
  documents: DocumentRecord[] = [...initialDocuments];
  heroSlides: HeroSlide[] = [...initialHeroSlides];
  announcements: Announcement[] = [...initialAnnouncements];
  quickAccess: QuickAccessService[] = [...initialQuickAccess];
  auditLogs: AuditLogEntry[] = [
    {
      timestamp: new Date().toISOString(),
      action: 'SYSTEM_BOOT',
      user: 'SYSTEM',
      status: 'SUCCESS',
      details: 'Sistem berjaya dimulakan.',
    },
  ];
}

const globalMemoryDb = new MemoryDatabase();

export class GoogleSheetsService {
  private static sheetsApi: sheets_v4.Sheets | null = null;

  private static isConfigured(): boolean {
    return Boolean(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      AppConfig.SPREADSHEET_ID
    );
  }

  private static getClient(): sheets_v4.Sheets | null {
    if (!this.isConfigured()) return null;

    if (!this.sheetsApi) {
      const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
      let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      privateKey = privateKey.replace(/\\n/g, '\n');

      const auth = new google.auth.JWT({
        email,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.sheetsApi = google.sheets({ version: 'v4', auth });
    }

    return this.sheetsApi;
  }

  // --- Audit Logging ---
  static async logAudit(action: string, user: string, status: 'SUCCESS' | 'FAILURE' | 'INFO', details: string) {
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      action: action.toUpperCase(),
      user: user || 'ADMIN',
      status,
      details: details.slice(0, 500),
    };

    globalMemoryDb.auditLogs.unshift(entry);
    if (globalMemoryDb.auditLogs.length > 50) globalMemoryDb.auditLogs.pop();

    const sheets = this.getClient();
    if (sheets) {
      try {
        await sheets.spreadsheets.values.append({
          spreadsheetId: AppConfig.SPREADSHEET_ID,
          range: `${AppConfig.SHEET_AUDIT_LOG}!A:E`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[entry.timestamp, entry.action, entry.user, entry.status, sanitizeString(entry.details)]],
          },
        });
      } catch (err) {
        console.warn('Google Sheets audit log write failed:', err);
      }
    }
  }

  // --- Announcements (Hebahan) ---
  static async getAnnouncements(limit?: number): Promise<Announcement[]> {
    const sheets = this.getClient();
    if (!sheets) {
      const items = [...globalMemoryDb.announcements];
      return limit ? items.slice(0, limit) : items;
    }

    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: AppConfig.SPREADSHEET_ID,
        range: `${AppConfig.SHEET_HEBAHAN}!A2:H`,
      });

      const rows = res.data.values || [];
      const announcements: Announcement[] = rows.map((r: (string | number | boolean | null | undefined)[]) => ({
        id: String(r[0] || ''),
        date: String(r[1] || ''),
        category: String(r[2] || 'Hebahan'),
        title: String(r[3] || ''),
        summary: String(r[4] || ''),
        link: String(r[5] || ''),
        imageUrl: String(r[6] || ''),
        createdAt: String(r[7] || ''),
      })).reverse();

      return limit ? announcements.slice(0, limit) : announcements;
    } catch (err) {
      console.warn('Failed to fetch from Google Sheets, using fallback:', err);
      return limit ? globalMemoryDb.announcements.slice(0, limit) : globalMemoryDb.announcements;
    }
  }

  static async saveAnnouncement(data: Partial<Announcement>): Promise<Announcement> {
    const now = new Date().toISOString();
    const id = data.id || `HEB_${Date.now()}`;
    const record: Announcement = {
      id,
      date: data.date || now.split('T')[0],
      category: data.category || 'Hebahan',
      title: data.title || '',
      summary: data.summary || '',
      link: data.link || '',
      imageUrl: data.imageUrl || '',
      createdAt: data.createdAt || now,
    };

    const existingIdx = globalMemoryDb.announcements.findIndex((a) => a.id === id);
    if (existingIdx > -1) {
      globalMemoryDb.announcements[existingIdx] = record;
    } else {
      globalMemoryDb.announcements.unshift(record);
    }

    const sheets = this.getClient();
    if (sheets) {
      try {
        if (data.id) {
          const rows = (await sheets.spreadsheets.values.get({
            spreadsheetId: AppConfig.SPREADSHEET_ID,
            range: `${AppConfig.SHEET_HEBAHAN}!A2:A`,
          })).data.values || [];
          const rowIdx = rows.findIndex((r) => r[0] === id);
          if (rowIdx > -1) {
            await sheets.spreadsheets.values.update({
              spreadsheetId: AppConfig.SPREADSHEET_ID,
              range: `${AppConfig.SHEET_HEBAHAN}!A${rowIdx + 2}:H${rowIdx + 2}`,
              valueInputOption: 'USER_ENTERED',
              requestBody: {
                values: [[
                  record.id,
                  record.date,
                  record.category,
                  sanitizeString(record.title),
                  sanitizeString(record.summary),
                  record.link,
                  record.imageUrl,
                  record.createdAt,
                ]],
              },
            });
          }
        } else {
          await sheets.spreadsheets.values.append({
            spreadsheetId: AppConfig.SPREADSHEET_ID,
            range: `${AppConfig.SHEET_HEBAHAN}!A:H`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [[
                record.id,
                record.date,
                record.category,
                sanitizeString(record.title),
                sanitizeString(record.summary),
                record.link,
                record.imageUrl,
                record.createdAt,
              ]],
            },
          });
        }
      } catch (err) {
        console.warn('Google Sheets saveAnnouncement error:', err);
      }
    }

    await this.logAudit('SAVE_ANNOUNCEMENT', 'ADMIN', 'SUCCESS', `Simpan hebahan: ${record.title}`);
    return record;
  }

  static async deleteAnnouncement(id: string): Promise<boolean> {
    globalMemoryDb.announcements = globalMemoryDb.announcements.filter((a) => a.id !== id);

    const sheets = this.getClient();
    if (sheets) {
      try {
        const rows = (await sheets.spreadsheets.values.get({
          spreadsheetId: AppConfig.SPREADSHEET_ID,
          range: `${AppConfig.SHEET_HEBAHAN}!A2:A`,
        })).data.values || [];
        const rowIdx = rows.findIndex((r) => r[0] === id);
        if (rowIdx > -1) {
          await sheets.spreadsheets.values.clear({
            spreadsheetId: AppConfig.SPREADSHEET_ID,
            range: `${AppConfig.SHEET_HEBAHAN}!A${rowIdx + 2}:H${rowIdx + 2}`,
          });
        }
      } catch (err) {
        console.warn('Google Sheets deleteAnnouncement error:', err);
      }
    }

    await this.logAudit('DELETE_ANNOUNCEMENT', 'ADMIN', 'SUCCESS', `Padam hebahan ID: ${id}`);
    return true;
  }

  // --- Hero Album ---
  static async getHeroAlbum(): Promise<HeroSlide[]> {
    const sheets = this.getClient();
    if (!sheets) {
      return [...globalMemoryDb.heroSlides].sort((a, b) => a.order - b.order);
    }

    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: AppConfig.SPREADSHEET_ID,
        range: `${AppConfig.SHEET_HERO_ALBUM}!A2:E`,
      });

      const rows = res.data.values || [];
      return rows.map((r: (string | number | boolean | null | undefined)[]) => ({
        id: String(r[0] || ''),
        imageUrl: String(r[1] || ''),
        order: Number(r[2] || 1),
        fileName: String(r[3] || ''),
        createdAt: String(r[4] || ''),
      })).sort((a: HeroSlide, b: HeroSlide) => a.order - b.order);
    } catch {
      return [...globalMemoryDb.heroSlides];
    }
  }

  static async saveHeroAlbum(slides: HeroSlide[]): Promise<HeroSlide[]> {
    globalMemoryDb.heroSlides = [...slides];

    const sheets = this.getClient();
    if (sheets) {
      try {
        await sheets.spreadsheets.values.clear({
          spreadsheetId: AppConfig.SPREADSHEET_ID,
          range: `${AppConfig.SHEET_HERO_ALBUM}!A2:E`,
        });

        const values = slides.map((s, idx) => [
          s.id || `ALB_${idx + 1}`,
          s.imageUrl,
          idx + 1,
          s.fileName,
          s.createdAt || new Date().toISOString(),
        ]);

        if (values.length > 0) {
          await sheets.spreadsheets.values.append({
            spreadsheetId: AppConfig.SPREADSHEET_ID,
            range: `${AppConfig.SHEET_HERO_ALBUM}!A2:E`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values },
          });
        }
      } catch (err) {
        console.warn('Google Sheets saveHeroAlbum error:', err);
      }
    }

    await this.logAudit('SAVE_HERO_ALBUM', 'ADMIN', 'SUCCESS', `Kemaskini ${slides.length} slaid album`);
    return globalMemoryDb.heroSlides;
  }

  static async clearHeroAlbum(): Promise<boolean> {
    globalMemoryDb.heroSlides = [];
    const sheets = this.getClient();
    if (sheets) {
      try {
        await sheets.spreadsheets.values.clear({
          spreadsheetId: AppConfig.SPREADSHEET_ID,
          range: `${AppConfig.SHEET_HERO_ALBUM}!A2:E`,
        });
      } catch {}
    }
    await this.logAudit('CLEAR_HERO_ALBUM', 'ADMIN', 'SUCCESS', 'Semua slaid album dipadamkan');
    return true;
  }

  // --- Units ---
  static async getUnits(): Promise<Unit[]> {
    const sheets = this.getClient();
    if (!sheets) {
      return [...globalMemoryDb.units].sort((a, b) => a.displayOrder - b.displayOrder);
    }

    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: AppConfig.SPREADSHEET_ID,
        range: `${AppConfig.SHEET_UNITS}!A2:Q`,
      });

      const rows = res.data.values || [];
      if (rows.length === 0) return [...globalMemoryDb.units];

      return rows.map((r: (string | number | boolean | null | undefined)[]) => ({
        unitId: String(r[0] || ''),
        unitCode: String(r[1] || ''),
        unitName: String(r[2] || ''),
        title: String(r[3] || ''),
        tagline: String(r[4] || ''),
        description: String(r[5] || ''),
        icon: String(r[6] || 'folder'),
        categoryId: String(r[7] || ''),
        logoFileId: String(r[8] || ''),
        bannerFileId: String(r[9] || ''),
        externalLink: String(r[10] || ''),
        displayOrder: Number(r[11] || 99),
        status: (r[12] as 'active' | 'inactive') || 'active',
        hasDocuments: String(r[13]) === 'true',
        driveFolderId: String(r[14] || ''),
        createdAt: String(r[15] || ''),
        updatedAt: String(r[16] || ''),
      })).filter((u: Unit) => u.status !== 'inactive').sort((a: Unit, b: Unit) => a.displayOrder - b.displayOrder);
    } catch {
      return [...globalMemoryDb.units];
    }
  }

  static async saveUnit(unit: Partial<Unit>): Promise<Unit> {
    const existingIdx = globalMemoryDb.units.findIndex((u) => u.unitId === unit.unitId);
    const updated: Unit = {
      ...(existingIdx > -1 ? globalMemoryDb.units[existingIdx] : initialUnits[0]),
      ...unit,
      updatedAt: new Date().toISOString(),
    } as Unit;

    if (existingIdx > -1) {
      globalMemoryDb.units[existingIdx] = updated;
    } else {
      globalMemoryDb.units.push(updated);
    }

    await this.logAudit('SAVE_UNIT', 'ADMIN', 'SUCCESS', `Simpan unit: ${updated.unitName}`);
    return updated;
  }

  static async deleteUnit(unitId: string): Promise<boolean> {
    const idx = globalMemoryDb.units.findIndex((u) => u.unitId === unitId);
    if (idx > -1) {
      globalMemoryDb.units[idx].status = 'inactive';
    }
    await this.logAudit('DELETE_UNIT', 'ADMIN', 'SUCCESS', `Unit ${unitId} dinyahaktifkan`);
    return true;
  }

  // --- Categories ---
  static async getCategories(): Promise<UnitCategory[]> {
    return [...globalMemoryDb.categories].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  // --- Unit Content ---
  static async getUnitContent(unitId?: string): Promise<UnitContent[]> {
    let items = [...globalMemoryDb.content];
    if (unitId) items = items.filter((c) => c.unitId === unitId);
    return items.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  static async saveUnitContent(data: Partial<UnitContent>): Promise<UnitContent> {
    const id = data.contentId || `CNT_${Date.now()}`;
    const record: UnitContent = {
      contentId: id,
      unitId: data.unitId || '',
      sectionType: data.sectionType || 'responsibility',
      title: data.title || '',
      content: data.content || '',
      displayOrder: data.displayOrder || 1,
      status: data.status || 'active',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const idx = globalMemoryDb.content.findIndex((c) => c.contentId === id);
    if (idx > -1) globalMemoryDb.content[idx] = record;
    else globalMemoryDb.content.push(record);

    await this.logAudit('SAVE_UNIT_CONTENT', 'ADMIN', 'SUCCESS', `Kandungan unit ${record.unitId}: ${record.title}`);
    return record;
  }

  static async deleteUnitContent(contentId: string): Promise<boolean> {
    globalMemoryDb.content = globalMemoryDb.content.filter((c) => c.contentId !== contentId);
    await this.logAudit('DELETE_UNIT_CONTENT', 'ADMIN', 'SUCCESS', `Padam kandungan ID ${contentId}`);
    return true;
  }

  // --- Employees ---
  static async getEmployees(unitId?: string): Promise<Employee[]> {
    let list = [...globalMemoryDb.employees].filter((e) => e.status !== 'inactive');
    if (unitId) list = list.filter((e) => e.unitId === unitId);
    return list.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  static async saveEmployee(emp: Partial<Employee>): Promise<Employee> {
    const id = emp.employeeId || `EMP_${Date.now()}`;
    const record: Employee = {
      employeeId: id,
      unitId: emp.unitId || '',
      name: emp.name || '',
      position: emp.position || '',
      email: emp.email || '',
      phone: emp.phone || '',
      accessRole: emp.accessRole || 'staff',
      displayOrder: emp.displayOrder || 99,
      status: emp.status || 'active',
      photoFileId: emp.photoFileId || '',
      createdAt: emp.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const idx = globalMemoryDb.employees.findIndex((e) => e.employeeId === id);
    if (idx > -1) globalMemoryDb.employees[idx] = record;
    else globalMemoryDb.employees.push(record);

    await this.logAudit('SAVE_EMPLOYEE', 'ADMIN', 'SUCCESS', `Pegawai: ${record.name} (${record.position})`);
    return record;
  }

  static async deleteEmployee(employeeId: string): Promise<boolean> {
    const idx = globalMemoryDb.employees.findIndex((e) => e.employeeId === employeeId);
    if (idx > -1) globalMemoryDb.employees[idx].status = 'inactive';
    await this.logAudit('DELETE_EMPLOYEE', 'ADMIN', 'SUCCESS', `Nyahaktifkan pegawai ID: ${employeeId}`);
    return true;
  }

  // --- Documents ---
  static async getDocuments(unitId?: string): Promise<DocumentRecord[]> {
    let list = [...globalMemoryDb.documents].filter((d) => d.status !== 'inactive');
    if (unitId) list = list.filter((d) => d.unitId === unitId);
    return list.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  static async saveDocument(doc: Partial<DocumentRecord>): Promise<DocumentRecord> {
    const id = doc.documentId || `DOC_${Date.now()}`;
    const fileId = doc.fileId || '';
    const record: DocumentRecord = {
      documentId: id,
      unitId: doc.unitId || '',
      title: doc.title || '',
      description: doc.description || '',
      fileId,
      fileName: doc.fileName || 'dokumen.pdf',
      fileType: doc.fileType || 'pdf',
      fileSize: doc.fileSize || '1.0 MB',
      category: doc.category || 'Dokumen',
      displayOrder: doc.displayOrder || 99,
      status: doc.status || 'active',
      uploadedAt: doc.uploadedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
      thumbUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w600`,
    };

    const idx = globalMemoryDb.documents.findIndex((d) => d.documentId === id);
    if (idx > -1) globalMemoryDb.documents[idx] = record;
    else globalMemoryDb.documents.push(record);

    await this.logAudit('SAVE_DOCUMENT', 'ADMIN', 'SUCCESS', `Dokumen: ${record.title} (${record.fileName})`);
    return record;
  }

  static async deleteDocument(docId: string): Promise<boolean> {
    const idx = globalMemoryDb.documents.findIndex((d) => d.documentId === docId);
    if (idx > -1) globalMemoryDb.documents[idx].status = 'inactive';
    await this.logAudit('DELETE_DOCUMENT', 'ADMIN', 'SUCCESS', `Padam dokumen ID: ${docId}`);
    return true;
  }

  // --- Quick Access ---
  static async getQuickAccess(): Promise<QuickAccessService[]> {
    return [...globalMemoryDb.quickAccess].sort((a, b) => a.order - b.order);
  }

  // --- System Info & Audit Logs ---
  static async getSystemInfo(): Promise<SystemInfo> {
    return {
      unitCount: globalMemoryDb.units.filter((u) => u.status === 'active').length,
      employeeCount: globalMemoryDb.employees.filter((e) => e.status === 'active').length,
      documentCount: globalMemoryDb.documents.filter((d) => d.status === 'active').length,
      announcementCount: globalMemoryDb.announcements.length,
      auditLogs: [...globalMemoryDb.auditLogs].slice(0, 20),
    };
  }
}
