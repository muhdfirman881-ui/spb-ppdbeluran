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

// High-Performance In-Memory Cache (TTL: 2 Minutes)
interface CacheStoreItem<T> {
  data: T;
  expires: number;
}
const cacheStore = new Map<string, CacheStoreItem<any>>();

function getFromCache<T>(key: string): T | null {
  const item = cacheStore.get(key);
  if (!item) return null;
  if (Date.now() > item.expires) {
    cacheStore.delete(key);
    return null;
  }
  return item.data;
}

function saveToCache<T>(key: string, data: T, ttlMs = 120000): T {
  cacheStore.set(key, { data, expires: Date.now() + ttlMs });
  return data;
}

function invalidateSheetCache(): void {
  cacheStore.clear();
}

function formatNameFromEmail(email: string): string {
  if (!email) return 'Pegawai Sektor';
  const local = email.split('@')[0];
  return local
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export class GoogleSheetsService {
  private static sheetsApi: sheets_v4.Sheets | null = null;

  static clearCache(): void {
    invalidateSheetCache();
  }

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

  // --- High-Performance Batch Portal Data Fetcher (1 HTTP Request) ---
  static async getBatchPortalData(): Promise<{
    heroAlbum: HeroSlide[];
    announcements: Announcement[];
    units: Unit[];
    categories: UnitCategory[];
    quickAccess: QuickAccessService[];
  }> {
    const cacheKey = 'batch_portal_initial_data';
    const cached = getFromCache<any>(cacheKey);
    if (cached) return cached;

    const sheets = this.getClient();
    if (!sheets) {
      const data = {
        heroAlbum: [...globalMemoryDb.heroSlides].sort((a, b) => a.order - b.order),
        announcements: [...globalMemoryDb.announcements].slice(0, 6),
        units: [...globalMemoryDb.units].sort((a, b) => a.displayOrder - b.displayOrder),
        categories: [...globalMemoryDb.categories].sort((a, b) => a.displayOrder - b.displayOrder),
        quickAccess: [...globalMemoryDb.quickAccess].sort((a, b) => a.order - b.order),
      };
      return saveToCache(cacheKey, data, 180000);
    }

    try {
      const ranges = [
        `${AppConfig.SHEET_HERO_ALBUM}!A2:E`,
        `${AppConfig.SHEET_HEBAHAN}!A2:H`,
        `${AppConfig.SHEET_UNITS}!A2:Q`,
        `${AppConfig.SHEET_UNIT_CATEGORIES}!A2:F`,
        `${AppConfig.SHEET_PERKHIDMATAN}!A2:F`,
      ];

      const res = await sheets.spreadsheets.values.batchGet({
        spreadsheetId: AppConfig.SPREADSHEET_ID,
        ranges,
      });

      const valueRanges = res.data.valueRanges || [];
      const heroRows = valueRanges[0]?.values || [];
      const hebahanRows = valueRanges[1]?.values || [];
      const unitsRows = valueRanges[2]?.values || [];
      const catRows = valueRanges[3]?.values || [];
      const quickRows = valueRanges[4]?.values || [];

      const heroAlbum: HeroSlide[] = heroRows.map((r, idx) => ({
        id: String(r[0] || `slide_${idx + 1}`),
        imageUrl: String(r[1] || ''),
        order: Number(r[2] || idx + 1),
        fileName: String(r[3] || ''),
        createdAt: String(r[4] || ''),
      })).sort((a, b) => a.order - b.order);

      const announcements: Announcement[] = hebahanRows.map((r) => ({
        id: String(r[0] || ''),
        date: String(r[1] || ''),
        category: String(r[2] || 'Hebahan'),
        title: String(r[3] || ''),
        summary: String(r[4] || ''),
        link: String(r[5] || ''),
        imageUrl: String(r[6] || ''),
        createdAt: String(r[7] || ''),
      })).reverse().slice(0, 6);

      const units: Unit[] = unitsRows.map((r, idx) => ({
        unitId: String(r[0] || ''),
        unitCode: String(r[1] || ''),
        unitName: String(r[2] || ''),
        title: String(r[3] || ''),
        tagline: String(r[4] || ''),
        description: String(r[5] || ''),
        icon: String(r[6] || 'folder'),
        categoryId: String(r[7] || 'CAT_SOKONGAN'),
        logoFileId: String(r[8] || ''),
        bannerFileId: String(r[9] || ''),
        externalLink: String(r[10] || ''),
        displayOrder: Number(r[11] || idx + 1),
        status: (r[12] as 'active' | 'inactive') || 'active',
        hasDocuments: String(r[13] || '').trim().toLowerCase() === 'true' || r[13] === true || r[13] === 1 || String(r[13]).trim() === '1',
        driveFolderId: String(r[14] || ''),
        createdAt: String(r[15] || ''),
        updatedAt: String(r[16] || ''),
      })).filter((u) => u.status !== 'inactive').sort((a, b) => a.displayOrder - b.displayOrder);

      const categories: UnitCategory[] = catRows.map((r, idx) => ({
        categoryId: String(r[0] || ''),
        categoryName: String(r[1] || ''),
        description: String(r[2] || ''),
        icon: String(r[3] || 'layers'),
        displayOrder: Number(r[4] || idx + 1),
        status: (String(r[5] || 'active') as 'active' | 'inactive'),
      })).filter((c) => c.status === 'active').sort((a, b) => a.displayOrder - b.displayOrder);

      const quickAccess: QuickAccessService[] = (quickRows.length > 0 ? quickRows : []).map((r, idx) => {
        const rawExternal = String(r[4] || '').trim().toLowerCase();
        const isExternal =
          rawExternal === 'ya' ||
          rawExternal === 'true' ||
          rawExternal === 'yes' ||
          rawExternal === '1';

        return {
          title: String(r[0] || '').trim(),
          description: String(r[1] || '').trim(),
          icon: String(r[2] || 'globe').trim(),
          link: String(r[3] || '#').trim(),
          external: isExternal,
          order: Number(r[5] || idx + 1),
        };
      }).sort((a, b) => a.order - b.order);

      const data = {
        heroAlbum: heroAlbum.length > 0 ? heroAlbum : [...globalMemoryDb.heroSlides],
        announcements: announcements.length > 0 ? announcements : [...globalMemoryDb.announcements].slice(0, 6),
        units: units.length > 0 ? units : [...globalMemoryDb.units],
        categories: categories.length > 0 ? categories : [...globalMemoryDb.categories],
        quickAccess: quickAccess.length > 0 ? quickAccess : [...globalMemoryDb.quickAccess],
      };

      return saveToCache(cacheKey, data, 180000);
    } catch (err) {
      console.warn('batchGet failed, falling back to cached single requests:', err);
      const [heroAlbum, announcements, units, categories, quickAccess] = await Promise.all([
        this.getHeroAlbum(),
        this.getAnnouncements(6),
        this.getUnits(),
        this.getCategories(),
        this.getQuickAccess(),
      ]);
      const data = { heroAlbum, announcements, units, categories, quickAccess };
      return saveToCache(cacheKey, data, 180000);
    }
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
    const cacheKey = `announcements_${limit || 'all'}`;
    const cached = getFromCache<Announcement[]>(cacheKey);
    if (cached) return cached;

    const sheets = this.getClient();
    if (!sheets) {
      const items = [...globalMemoryDb.announcements];
      const result = limit ? items.slice(0, limit) : items;
      return saveToCache(cacheKey, result, 120000);
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

      const result = limit ? announcements.slice(0, limit) : announcements;
      return saveToCache(cacheKey, result, 120000);
    } catch (err) {
      console.warn('Failed to fetch from Google Sheets, using fallback:', err);
      const items = limit ? globalMemoryDb.announcements.slice(0, limit) : globalMemoryDb.announcements;
      return saveToCache(cacheKey, items, 60000);
    }
  }

  static async saveAnnouncement(data: Partial<Announcement>): Promise<Announcement> {
    invalidateSheetCache();
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
    invalidateSheetCache();
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
    const cacheKey = 'hero_album';
    const cached = getFromCache<HeroSlide[]>(cacheKey);
    if (cached) return cached;

    const sheets = this.getClient();
    if (!sheets) {
      const slides = [...globalMemoryDb.heroSlides].sort((a, b) => a.order - b.order);
      return saveToCache(cacheKey, slides, 120000);
    }

    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: AppConfig.SPREADSHEET_ID,
        range: `${AppConfig.SHEET_HERO_ALBUM}!A2:E`,
      });

      const rows = res.data.values || [];
      const slides = rows.map((r: (string | number | boolean | null | undefined)[]) => ({
        id: String(r[0] || ''),
        imageUrl: String(r[1] || ''),
        order: Number(r[2] || 1),
        fileName: String(r[3] || ''),
        createdAt: String(r[4] || ''),
      })).sort((a: HeroSlide, b: HeroSlide) => a.order - b.order);

      return saveToCache(cacheKey, slides, 120000);
    } catch {
      return saveToCache(cacheKey, [...globalMemoryDb.heroSlides], 60000);
    }
  }

  static async saveHeroAlbum(slides: HeroSlide[]): Promise<HeroSlide[]> {
    invalidateSheetCache();
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
    invalidateSheetCache();
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
    const cacheKey = 'units_all';
    const cached = getFromCache<Unit[]>(cacheKey);
    if (cached) return cached;

    const sheets = this.getClient();
    if (!sheets) {
      const list = [...globalMemoryDb.units].sort((a, b) => a.displayOrder - b.displayOrder);
      return saveToCache(cacheKey, list, 120000);
    }

    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: AppConfig.SPREADSHEET_ID,
        range: `${AppConfig.SHEET_UNITS}!A2:Q`,
      });

      const rows = res.data.values || [];
      if (rows.length === 0) return saveToCache(cacheKey, [...globalMemoryDb.units], 120000);

      const units = rows.map((r: (string | number | boolean | null | undefined)[]) => ({
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
        hasDocuments: String(r[13] || '').trim().toLowerCase() === 'true' || r[13] === true || r[13] === 1 || String(r[13]).trim() === '1',
        driveFolderId: String(r[14] || ''),
        createdAt: String(r[15] || ''),
        updatedAt: String(r[16] || ''),
      })).filter((u: Unit) => u.status !== 'inactive').sort((a: Unit, b: Unit) => a.displayOrder - b.displayOrder);

      return saveToCache(cacheKey, units, 120000);
    } catch {
      return saveToCache(cacheKey, [...globalMemoryDb.units], 60000);
    }
  }

  static async saveUnit(unit: Partial<Unit>): Promise<Unit> {
    invalidateSheetCache();
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

    const sheets = this.getClient();
    if (sheets && updated.unitId) {
      try {
        const row = [
          updated.unitId,
          updated.unitCode,
          sanitizeString(updated.unitName),
          sanitizeString(updated.title),
          sanitizeString(updated.tagline),
          sanitizeString(updated.description),
          updated.icon,
          updated.categoryId,
          updated.logoFileId || '',
          updated.bannerFileId || '',
          updated.externalLink || '',
          updated.displayOrder,
          updated.status,
          updated.hasDocuments ? 'TRUE' : 'FALSE',
          updated.driveFolderId || '',
          updated.createdAt || new Date().toISOString(),
          updated.updatedAt,
        ];

        const checkRes = await sheets.spreadsheets.values.get({
          spreadsheetId: AppConfig.SPREADSHEET_ID,
          range: `${AppConfig.SHEET_UNITS}!A2:A`,
        });
        const existingIds = (checkRes.data.values || []).map((r) => r[0]);
        const existingRowIndex = existingIds.findIndex((uid) => uid === updated.unitId);

        if (existingRowIndex > -1) {
          const rowNum = existingRowIndex + 2;
          await sheets.spreadsheets.values.update({
            spreadsheetId: AppConfig.SPREADSHEET_ID,
            range: `${AppConfig.SHEET_UNITS}!A${rowNum}:Q${rowNum}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [row] },
          });
        } else {
          await sheets.spreadsheets.values.append({
            spreadsheetId: AppConfig.SPREADSHEET_ID,
            range: `${AppConfig.SHEET_UNITS}!A2:Q`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [row] },
          });
        }
      } catch (err) {
        console.warn('Google Sheets saveUnit error:', err);
      }
    }

    await this.logAudit('SAVE_UNIT', 'ADMIN', 'SUCCESS', `Simpan unit: ${updated.unitName}`);
    return updated;
  }

  static async deleteUnit(unitId: string): Promise<boolean> {
    invalidateSheetCache();
    const idx = globalMemoryDb.units.findIndex((u) => u.unitId === unitId);
    if (idx > -1) {
      globalMemoryDb.units[idx].status = 'inactive';
    }

    const sheets = this.getClient();
    if (sheets) {
      try {
        const checkRes = await sheets.spreadsheets.values.get({
          spreadsheetId: AppConfig.SPREADSHEET_ID,
          range: `${AppConfig.SHEET_UNITS}!A2:A`,
        });
        const existingIds = (checkRes.data.values || []).map((r) => r[0]);
        const existingRowIndex = existingIds.findIndex((uid) => uid === unitId);
        if (existingRowIndex > -1) {
          const rowNum = existingRowIndex + 2;
          await sheets.spreadsheets.values.update({
            spreadsheetId: AppConfig.SPREADSHEET_ID,
            range: `${AppConfig.SHEET_UNITS}!M${rowNum}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [['inactive']] },
          });
        }
      } catch (err) {
        console.warn('Google Sheets deleteUnit error:', err);
      }
    }

    await this.logAudit('DELETE_UNIT', 'ADMIN', 'SUCCESS', `Unit ${unitId} dinyahaktifkan`);
    return true;
  }

  // --- Categories ---
  static async getCategories(): Promise<UnitCategory[]> {
    const cacheKey = 'categories_all';
    const cached = getFromCache<UnitCategory[]>(cacheKey);
    if (cached) return cached;

    const sheets = this.getClient();
    let sheetCategories: UnitCategory[] = [];

    if (sheets) {
      try {
        const res = await sheets.spreadsheets.values.get({
          spreadsheetId: AppConfig.SPREADSHEET_ID,
          range: `${AppConfig.SHEET_UNIT_CATEGORIES}!A2:H`,
        });

        const rows = res.data.values || [];
        sheetCategories = rows
          .map((r, idx) => ({
            categoryId: String(r[0] || '').trim(),
            categoryName: String(r[1] || '').trim(),
            description: String(r[2] || '').trim(),
            icon: String(r[3] || 'layers').trim(),
            displayOrder: Number(r[4] || idx + 1),
            status: (String(r[5] || 'active').trim().toLowerCase() === 'inactive' ? 'inactive' : 'active') as 'active' | 'inactive',
          }))
          .filter((c) => c.status === 'active' && c.categoryId);
      } catch (err) {
        console.warn('Google Sheets getCategories error:', err);
      }
    }

    const list = sheetCategories.length > 0 ? sheetCategories : [...globalMemoryDb.categories];
    const result = list.sort((a, b) => a.displayOrder - b.displayOrder);
    return saveToCache(cacheKey, result, 300000);
  }

  // --- Unit Content ---
  static async getUnitContent(unitId?: string): Promise<UnitContent[]> {
    const targetUnit = unitId ? this.normalizeUnitId(unitId) : undefined;
    const cacheKey = `unit_content_${targetUnit || 'all'}`;
    const cached = getFromCache<UnitContent[]>(cacheKey);
    if (cached) return cached;

    const sheets = this.getClient();
    let sheetContent: UnitContent[] = [];

    if (sheets) {
      try {
        const res = await sheets.spreadsheets.values.get({
          spreadsheetId: AppConfig.SPREADSHEET_ID,
          range: `${AppConfig.SHEET_UNIT_CONTENT}!A2:L`,
        });

        const rows = res.data.values || [];
        sheetContent = rows
          .map((r, idx) => {
            let sectionType: 'responsibility' | 'service' | 'custom' = 'responsibility';
            const rawType = String(r[2] || '').trim().toLowerCase();
            if (rawType === 'service') sectionType = 'service';
            else if (rawType === 'custom' || rawType === 'general') sectionType = 'custom';

            return {
              contentId: String(r[0] || `CNT_${idx + 1}`),
              unitId: this.normalizeUnitId(String(r[1] || '')),
              sectionType,
              title: String(r[3] || '').trim(),
              content: String(r[4] || '').trim(),
              imageFileId: String(r[5] || '').trim(),
              documentFileId: String(r[6] || '').trim(),
              linkUrl: String(r[7] || '').trim(),
              displayOrder: Number(r[8] || idx + 1),
              status: (String(r[9] || 'active').trim().toLowerCase() === 'inactive' ? 'inactive' : 'active') as 'active' | 'inactive',
              createdAt: String(r[10] || ''),
              updatedAt: String(r[11] || ''),
            };
          })
          .filter((c) => c.status !== 'inactive' && c.title);
      } catch (err) {
        console.warn('Google Sheets getUnitContent error:', err);
      }
    }

    let items = sheetContent.length > 0 ? sheetContent : [...globalMemoryDb.content];
    if (targetUnit) {
      items = items.filter((c) => this.normalizeUnitId(c.unitId) === targetUnit);
    }
    const result = items.sort((a, b) => a.displayOrder - b.displayOrder);
    return saveToCache(cacheKey, result, 120000);
  }

  static async saveUnitContent(data: Partial<UnitContent>): Promise<UnitContent> {
    invalidateSheetCache();
    const id = data.contentId || `CNT_${Date.now()}`;
    const record: UnitContent = {
      contentId: id,
      unitId: this.normalizeUnitId(data.unitId || ''),
      sectionType: data.sectionType || 'responsibility',
      title: data.title || '',
      content: data.content || '',
      imageFileId: data.imageFileId || '',
      documentFileId: data.documentFileId || '',
      linkUrl: data.linkUrl || '',
      displayOrder: data.displayOrder || 1,
      status: data.status || 'active',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const idx = globalMemoryDb.content.findIndex((c) => c.contentId === id);
    if (idx > -1) globalMemoryDb.content[idx] = record;
    else globalMemoryDb.content.push(record);

    const sheets = this.getClient();
    if (sheets) {
      try {
        const row = [
          record.contentId,
          record.unitId,
          record.sectionType,
          sanitizeString(record.title),
          sanitizeString(record.content),
          record.imageFileId,
          record.documentFileId,
          record.linkUrl,
          record.displayOrder,
          record.status,
          record.createdAt,
          record.updatedAt,
        ];

        const checkRes = await sheets.spreadsheets.values.get({
          spreadsheetId: AppConfig.SPREADSHEET_ID,
          range: `${AppConfig.SHEET_UNIT_CONTENT}!A2:A`,
        });
        const existingIds = (checkRes.data.values || []).map((r) => r[0]);
        const existingRowIndex = existingIds.findIndex((cid) => cid === id);

        if (existingRowIndex > -1) {
          const rowNum = existingRowIndex + 2;
          await sheets.spreadsheets.values.update({
            spreadsheetId: AppConfig.SPREADSHEET_ID,
            range: `${AppConfig.SHEET_UNIT_CONTENT}!A${rowNum}:L${rowNum}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [row] },
          });
        } else {
          await sheets.spreadsheets.values.append({
            spreadsheetId: AppConfig.SPREADSHEET_ID,
            range: `${AppConfig.SHEET_UNIT_CONTENT}!A2:L`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [row] },
          });
        }
      } catch (err) {
        console.warn('Google Sheets saveUnitContent error:', err);
      }
    }

    await this.logAudit('SAVE_UNIT_CONTENT', 'ADMIN', 'SUCCESS', `Kandungan unit ${record.unitId}: ${record.title}`);
    return record;
  }

  static async deleteUnitContent(contentId: string): Promise<boolean> {
    invalidateSheetCache();
    globalMemoryDb.content = globalMemoryDb.content.filter((c) => c.contentId !== contentId);

    const sheets = this.getClient();
    if (sheets) {
      try {
        const checkRes = await sheets.spreadsheets.values.get({
          spreadsheetId: AppConfig.SPREADSHEET_ID,
          range: `${AppConfig.SHEET_UNIT_CONTENT}!A2:A`,
        });
        const existingIds = (checkRes.data.values || []).map((r) => r[0]);
        const existingRowIndex = existingIds.findIndex((cid) => cid === contentId);
        if (existingRowIndex > -1) {
          const rowNum = existingRowIndex + 2;
          await sheets.spreadsheets.values.update({
            spreadsheetId: AppConfig.SPREADSHEET_ID,
            range: `${AppConfig.SHEET_UNIT_CONTENT}!J${rowNum}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [['inactive']] },
          });
        }
      } catch (err) {
        console.warn('Google Sheets deleteUnitContent error:', err);
      }
    }

    await this.logAudit('DELETE_UNIT_CONTENT', 'ADMIN', 'SUCCESS', `Padam kandungan ID ${contentId}`);
    return true;
  }

  // --- Employees ---
  static async getEmployees(unitId?: string): Promise<Employee[]> {
    const targetUnit = unitId ? this.normalizeUnitId(unitId) : undefined;
    const cacheKey = `employees_${targetUnit || 'all'}`;
    const cached = getFromCache<Employee[]>(cacheKey);
    if (cached) return cached;

    const sheets = this.getClient();
    let sheetEmployees: Employee[] = [];

    if (sheets) {
      try {
        const res = await sheets.spreadsheets.values.get({
          spreadsheetId: AppConfig.SPREADSHEET_ID,
          range: `${AppConfig.SHEET_EMPLOYEES}!A2:L`,
        });

        const rows = res.data.values || [];
        sheetEmployees = rows
          .map((r, idx) => {
            const rawEmail = String(r[5] || '').trim();
            const rawName = String(r[2] || '').trim();
            const name = rawName || (rawEmail ? formatNameFromEmail(rawEmail) : `Pegawai ${idx + 1}`);
            const empId = String(
              r[0] || (rawEmail ? `EMP_${rawEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_')}` : `EMP_${idx + 1}`)
            );
            const rawRole = String(r[7] || 'staff').toLowerCase();
            const accessRole: 'admin' | 'staff' = rawRole === 'admin' ? 'admin' : 'staff';
            const position =
              String(r[3] || '').trim() ||
              (accessRole === 'admin' ? 'Pegawai Pentadbir Sektor' : 'Pegawai Sektor Pembelajaran');

            return {
              employeeId: empId,
              unitId: this.normalizeUnitId(String(r[1] || '')),
              name,
              position,
              photoFileId: String(r[4] || '').trim(),
              email: rawEmail,
              phone: String(r[6] || '').trim(),
              accessRole,
              displayOrder: Number(r[8] || idx + 1),
              status: (String(r[9] || 'active').trim().toLowerCase() === 'inactive' ? 'inactive' : 'active') as 'active' | 'inactive',
              createdAt: String(r[10] || ''),
              updatedAt: String(r[11] || ''),
            };
          })
          .filter((e) => e.status !== 'inactive' && (e.name || e.email));
      } catch (err) {
        console.warn('Google Sheets getEmployees error:', err);
      }
    }

    let list: Employee[] = [];
    if (sheetEmployees.length > 0) {
      list = sheetEmployees;
    } else {
      list = [...globalMemoryDb.employees].filter((e) => e.status !== 'inactive');
    }

    if (targetUnit) {
      list = list.filter((e) => this.normalizeUnitId(e.unitId) === targetUnit);
    }

    const result = list.sort((a, b) => a.displayOrder - b.displayOrder);
    return saveToCache(cacheKey, result, 120000);
  }

  static async saveEmployee(emp: Partial<Employee>): Promise<Employee> {
    invalidateSheetCache();
    const id = emp.employeeId || `EMP_${Date.now()}`;
    const record: Employee = {
      employeeId: id,
      unitId: this.normalizeUnitId(emp.unitId || ''),
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

    const sheets = this.getClient();
    if (sheets) {
      try {
        const row = [
          record.employeeId,
          record.unitId,
          sanitizeString(record.name),
          sanitizeString(record.position),
          record.photoFileId,
          record.email,
          record.phone,
          record.accessRole,
          record.displayOrder,
          record.status,
          record.createdAt,
          record.updatedAt,
        ];

        const checkRes = await sheets.spreadsheets.values.get({
          spreadsheetId: AppConfig.SPREADSHEET_ID,
          range: `${AppConfig.SHEET_EMPLOYEES}!A2:F`,
        });
        const existingRows = checkRes.data.values || [];
        const existingRowIndex = existingRows.findIndex(
          (r) => r[0] === id || (record.email && r[5]?.toLowerCase() === record.email.toLowerCase())
        );

        if (existingRowIndex > -1) {
          const rowNum = existingRowIndex + 2;
          await sheets.spreadsheets.values.update({
            spreadsheetId: AppConfig.SPREADSHEET_ID,
            range: `${AppConfig.SHEET_EMPLOYEES}!A${rowNum}:L${rowNum}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [row] },
          });
        } else {
          await sheets.spreadsheets.values.append({
            spreadsheetId: AppConfig.SPREADSHEET_ID,
            range: `${AppConfig.SHEET_EMPLOYEES}!A2:L`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [row] },
          });
        }
      } catch (err) {
        console.warn('Google Sheets saveEmployee error:', err);
      }
    }

    await this.logAudit('SAVE_EMPLOYEE', 'ADMIN', 'SUCCESS', `Pegawai: ${record.name} (${record.position})`);
    return record;
  }

  static async deleteEmployee(employeeId: string): Promise<boolean> {
    invalidateSheetCache();
    const idx = globalMemoryDb.employees.findIndex((e) => e.employeeId === employeeId);
    if (idx > -1) globalMemoryDb.employees[idx].status = 'inactive';

    const sheets = this.getClient();
    if (sheets) {
      try {
        const checkRes = await sheets.spreadsheets.values.get({
          spreadsheetId: AppConfig.SPREADSHEET_ID,
          range: `${AppConfig.SHEET_EMPLOYEES}!A2:A`,
        });
        const existingIds = (checkRes.data.values || []).map((r) => r[0]);
        const existingRowIndex = existingIds.findIndex((eid) => eid === employeeId);
        if (existingRowIndex > -1) {
          const rowNum = existingRowIndex + 2;
          await sheets.spreadsheets.values.update({
            spreadsheetId: AppConfig.SPREADSHEET_ID,
            range: `${AppConfig.SHEET_EMPLOYEES}!J${rowNum}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [['inactive']] },
          });
        }
      } catch (err) {
        console.warn('Google Sheets deleteEmployee error:', err);
      }
    }

    await this.logAudit('DELETE_EMPLOYEE', 'ADMIN', 'SUCCESS', `Nyahaktifkan pegawai ID: ${employeeId}`);
    return true;
  }

  static normalizeUnitId(id?: string): string {
    if (!id) return '';
    const s = id.toLowerCase().trim();
    if (s === 'unit-sm' || s === 'unit-sains-matematik') return 'unit-sm';
    if (s === 'tvet' || s === 'unit-tvet') return 'tvet';
    if (s === 'sains-sosial' || s === 'unit-sains-sosial') return 'sains-sosial';
    return s;
  }

  // --- Documents ---
  static async getDocuments(unitId?: string): Promise<DocumentRecord[]> {
    const targetUnit = unitId ? this.normalizeUnitId(unitId) : undefined;
    const cacheKey = `documents_${targetUnit || 'all'}`;
    const cached = getFromCache<DocumentRecord[]>(cacheKey);
    if (cached) return cached;

    const sheets = this.getClient();
    let sheetDocs: DocumentRecord[] = [];

    if (sheets) {
      try {
        const res = await sheets.spreadsheets.values.get({
          spreadsheetId: AppConfig.SPREADSHEET_ID,
          range: `${AppConfig.SHEET_DOCUMENTS}!A2:M`,
        });

        const rows = res.data.values || [];
        sheetDocs = rows.map((r, idx) => {
          const docId = String(r[0] || `DOC_${idx + 1}`);
          const fileId = String(r[4] || '');
          const fileName = String(r[5] || 'dokumen.pdf');
          let fileType = String(r[6] || 'pdf').toLowerCase();
          if (/\.pdf$/i.test(fileName)) fileType = 'pdf';
          else if (/\.(jpg|jpeg|png|webp)$/i.test(fileName)) fileType = 'image';
          else if (/\.(ppt|pptx)$/i.test(fileName)) fileType = 'ppt';
          else if (/\.(doc|docx)$/i.test(fileName)) fileType = 'doc';

          return {
            documentId: docId,
            unitId: String(r[1] || '').trim(),
            title: String(r[2] || fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')),
            description: String(r[3] || ''),
            fileId,
            fileName,
            fileType,
            fileSize: String(r[7] || '1.0 MB'),
            category: String(r[8] || 'Umum'),
            displayOrder: Number(r[9] || idx + 1),
            status: (String(r[10] || 'active').toLowerCase() as 'active' | 'inactive') || 'active',
            uploadedAt: String(r[11] || ''),
            updatedAt: String(r[12] || ''),
            viewUrl: `/api/files/${fileId}?inline=true`,
            downloadUrl: `/api/files/${fileId}?download=true`,
            thumbUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w600`,
          };
        }).filter((d) => d.status !== 'inactive');

        if (sheetDocs.length > 0) {
          globalMemoryDb.documents = [...sheetDocs];
        }
      } catch (err) {
        console.warn('Google Sheets getDocuments error, using fallback:', err);
      }
    }

    const allDocs = sheetDocs.length > 0 ? sheetDocs : [...globalMemoryDb.documents].filter((d) => d.status !== 'inactive');

    let list: DocumentRecord[] = [];
    if (targetUnit) {
      list = allDocs.filter((d) => this.normalizeUnitId(d.unitId) === targetUnit);
      if (list.length === 0) {
        // Fallback to initialDocuments for this unit so every unit has starter documents
        list = initialDocuments.filter((d) => this.normalizeUnitId(d.unitId) === targetUnit);
      }
    } else {
      list = allDocs;
    }

    const result = list.sort((a, b) => a.displayOrder - b.displayOrder);
    return saveToCache(cacheKey, result, 120000);
  }

  static async saveDocument(doc: Partial<DocumentRecord>): Promise<DocumentRecord> {
    invalidateSheetCache();
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
      viewUrl: `/api/files/${fileId}?inline=true`,
      downloadUrl: `/api/files/${fileId}?download=true`,
      thumbUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w600`,
    };

    const idx = globalMemoryDb.documents.findIndex((d) => d.documentId === id);
    if (idx > -1) globalMemoryDb.documents[idx] = record;
    else globalMemoryDb.documents.push(record);

    const sheets = this.getClient();
    if (sheets) {
      try {
        const row = [
          record.documentId,
          record.unitId,
          record.title,
          record.description,
          record.fileId,
          record.fileName,
          record.fileType,
          record.fileSize,
          record.category,
          record.displayOrder,
          record.status,
          record.uploadedAt,
          record.updatedAt,
        ];
        const checkRes = await sheets.spreadsheets.values.get({
          spreadsheetId: AppConfig.SPREADSHEET_ID,
          range: `${AppConfig.SHEET_DOCUMENTS}!A2:A`,
        });
        const existingIds = (checkRes.data.values || []).map((r) => r[0]);
        const existingRowIndex = existingIds.findIndex((eid) => eid === id);

        if (existingRowIndex > -1) {
          const rowNum = existingRowIndex + 2;
          await sheets.spreadsheets.values.update({
            spreadsheetId: AppConfig.SPREADSHEET_ID,
            range: `${AppConfig.SHEET_DOCUMENTS}!A${rowNum}:M${rowNum}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [row] },
          });
        } else {
          await sheets.spreadsheets.values.append({
            spreadsheetId: AppConfig.SPREADSHEET_ID,
            range: `${AppConfig.SHEET_DOCUMENTS}!A2:M`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [row] },
          });
        }
      } catch (err) {
        console.warn('Google Sheets saveDocument error:', err);
      }
    }

    await this.logAudit('SAVE_DOCUMENT', 'ADMIN', 'SUCCESS', `Dokumen: ${record.title} (${record.fileName})`);
    return record;
  }

  static async deleteDocument(docId: string): Promise<boolean> {
    invalidateSheetCache();
    const idx = globalMemoryDb.documents.findIndex((d) => d.documentId === docId);
    if (idx > -1) globalMemoryDb.documents[idx].status = 'inactive';

    const sheets = this.getClient();
    if (sheets) {
      try {
        const checkRes = await sheets.spreadsheets.values.get({
          spreadsheetId: AppConfig.SPREADSHEET_ID,
          range: `${AppConfig.SHEET_DOCUMENTS}!A2:A`,
        });
        const existingIds = (checkRes.data.values || []).map((r) => r[0]);
        const existingRowIndex = existingIds.findIndex((eid) => eid === docId);
        if (existingRowIndex > -1) {
          const rowNum = existingRowIndex + 2;
          await sheets.spreadsheets.values.update({
            spreadsheetId: AppConfig.SPREADSHEET_ID,
            range: `${AppConfig.SHEET_DOCUMENTS}!K${rowNum}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [['inactive']] },
          });
        }
      } catch (err) {
        console.warn('Google Sheets deleteDocument error:', err);
      }
    }

    await this.logAudit('DELETE_DOCUMENT', 'ADMIN', 'SUCCESS', `Padam dokumen ID: ${docId}`);
    return true;
  }

  // --- Settings ---
  static async getSettings(): Promise<Record<string, string>> {
    const cacheKey = 'settings_all';
    const cached = getFromCache<Record<string, string>>(cacheKey);
    if (cached) return cached;

    const sheets = this.getClient();
    const settings: Record<string, string> = {
      CARTA_ORGANISASI_URL: AppConfig.CARTA_ORGANISASI_URL,
    };

    if (sheets) {
      try {
        const res = await sheets.spreadsheets.values.get({
          spreadsheetId: AppConfig.SPREADSHEET_ID,
          range: `${AppConfig.SHEET_SETTINGS}!A2:D`,
        });
        const rows = res.data.values || [];
        rows.forEach((r) => {
          if (r[0]) {
            settings[String(r[0]).trim()] = String(r[1] || '').trim();
          }
        });
      } catch (err) {
        console.warn('Google Sheets getSettings error:', err);
      }
    }

    return saveToCache(cacheKey, settings, 300000);
  }

  // --- Quick Access ---
  static async getQuickAccess(): Promise<QuickAccessService[]> {
    const cacheKey = 'quick_access_all';
    const cached = getFromCache<QuickAccessService[]>(cacheKey);
    if (cached) return cached;

    const sheets = this.getClient();
    let sheetServices: QuickAccessService[] = [];

    if (sheets) {
      try {
        const res = await sheets.spreadsheets.values.get({
          spreadsheetId: AppConfig.SPREADSHEET_ID,
          range: `${AppConfig.SHEET_PERKHIDMATAN}!A2:F`,
        });

        const rows = res.data.values || [];
        sheetServices = rows
          .map((r, idx) => {
            const rawExternal = String(r[4] || '').trim().toLowerCase();
            const isExternal =
              rawExternal === 'ya' ||
              rawExternal === 'true' ||
              rawExternal === 'yes' ||
              rawExternal === '1';

            return {
              title: String(r[0] || '').trim(),
              description: String(r[1] || '').trim(),
              icon: String(r[2] || 'globe').trim(),
              link: String(r[3] || '#').trim(),
              external: isExternal,
              order: Number(r[5] || idx + 1),
            };
          })
          .filter((s) => s.title);
      } catch (err) {
        console.warn('Google Sheets getQuickAccess error:', err);
      }
    }

    const list = sheetServices.length > 0 ? sheetServices : [...globalMemoryDb.quickAccess];
    const result = list.sort((a, b) => a.order - b.order);
    return saveToCache(cacheKey, result, 300000);
  }

  // --- System Info & Audit Logs ---
  static async getSystemInfo(): Promise<SystemInfo> {
    const [units, employees, documents, announcements] = await Promise.all([
      this.getUnits(),
      this.getEmployees(),
      this.getDocuments(),
      this.getAnnouncements(),
    ]);

    return {
      unitCount: units.filter((u) => u.status === 'active').length,
      employeeCount: employees.filter((e) => e.status === 'active').length,
      documentCount: documents.filter((d) => d.status === 'active').length,
      announcementCount: announcements.length,
      auditLogs: [...globalMemoryDb.auditLogs].slice(0, 20),
    };
  }
}
