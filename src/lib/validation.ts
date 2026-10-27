import { z } from 'zod';

export function sanitizeString(val: unknown, maxLen = 2000): string {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();
  // Strip dangerous formula injection prefixes for Google Sheets
  if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
    str = "'" + str;
  }
  return str.slice(0, maxLen);
}

export function generateId(prefix = 'ESPB'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`.toUpperCase();
}

export const AnnouncementSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, 'Tajuk wajib diisi (minimum 3 aksara)'),
  category: z.string().default('Hebahan'),
  date: z.string().default(() => new Date().toISOString().split('T')[0]),
  summary: z.string().min(5, 'Ringkasan wajib diisi'),
  link: z.string().url('Pautan tidak sah').or(z.literal('')).optional(),
  imageUrl: z.string().optional(),
});

export const UnitSchema = z.object({
  unitId: z.string().min(2, 'ID Unit wajib diisi'),
  unitCode: z.string().min(1, 'Kod Unit wajib diisi'),
  unitName: z.string().min(2, 'Nama Unit wajib diisi'),
  title: z.string().min(2, 'Tajuk Unit wajib diisi'),
  tagline: z.string().default(''),
  description: z.string().default(''),
  icon: z.string().default('folder'),
  categoryId: z.string().default('CAT_SOKONGAN'),
  externalLink: z.string().optional(),
  bannerFileId: z.string().optional(),
  teamPhotoUrl: z.string().optional(),
  logoFileId: z.string().optional(),
  displayOrder: z.coerce.number().default(99),
  status: z.enum(['active', 'inactive']).default('active'),
  hasDocuments: z.boolean().default(true),
  driveFolderId: z.string().optional(),
});

export const UnitContentSchema = z.object({
  contentId: z.string().optional(),
  unitId: z.string().min(1, 'ID Unit diperlukan'),
  sectionType: z.enum(['responsibility', 'service', 'custom']),
  title: z.string().min(1, 'Kandungan / Peranan diperlukan'),
  content: z.string().optional().default(''),
  displayOrder: z.coerce.number().default(1),
  status: z.enum(['active', 'inactive']).default('active'),
  linkUrl: z.string().optional(),
});

export const EmployeeSchema = z.object({
  employeeId: z.string().optional(),
  unitId: z.string().min(1, 'Unit wajib dipilih'),
  name: z.string().min(2, 'Nama pegawai wajib diisi'),
  position: z.string().min(2, 'Jawatan wajib diisi'),
  photoFileId: z.string().optional(),
  email: z.string().email('Format emel tidak sah').or(z.literal('')).optional(),
  phone: z.string().optional(),
  accessRole: z.enum(['admin', 'staff']).default('staff'),
  displayOrder: z.coerce.number().default(99),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const DocumentSchema = z.object({
  documentId: z.string().optional(),
  unitId: z.string().min(1, 'Unit wajib dipilih'),
  title: z.string().min(2, 'Tajuk dokumen wajib diisi'),
  description: z.string().optional().default(''),
  fileId: z.string().min(1, 'ID fail Google Drive diperlukan'),
  fileName: z.string().min(1, 'Nama fail diperlukan'),
  fileType: z.string().default('pdf'),
  fileSize: z.string().default('0 KB'),
  category: z.string().default('Dokumen'),
  displayOrder: z.coerce.number().default(99),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const LoginSchema = z.object({
  passphrase: z.string().min(1, 'Kata laluan diperlukan'),
});
