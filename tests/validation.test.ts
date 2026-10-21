import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  generateId,
  AnnouncementSchema,
  UnitSchema,
  EmployeeSchema,
  DocumentSchema,
} from '@/lib/validation';

describe('Validation & Data Sanitization', () => {
  it('sanitizes potential spreadsheet formula injection prefixes', () => {
    expect(sanitizeString('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
    expect(sanitizeString('+cmd|calc!A0')).toBe("'+cmd|calc!A0");
    expect(sanitizeString('-cmd|calc!A0')).toBe("'-cmd|calc!A0");
    expect(sanitizeString('@calc')).toBe("'@calc");
    expect(sanitizeString('Normal safe text')).toBe('Normal safe text');
  });

  it('generates unique prefixed IDs', () => {
    const id1 = generateId('HEB');
    const id2 = generateId('HEB');
    expect(id1.startsWith('HEB_')).toBe(true);
    expect(id2.startsWith('HEB_')).toBe(true);
    expect(id1).not.toBe(id2);
  });

  it('validates correct announcement payloads', () => {
    const valid = {
      title: 'Bengkel Pedagogi Guru 2026',
      summary: 'Bengkel peningkatan kemahiran instruksional.',
      category: 'Program',
      date: '2026-04-10',
    };
    const parsed = AnnouncementSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it('rejects invalid announcement payloads with short titles', () => {
    const invalid = {
      title: 'AB',
      summary: 'Ringkasan ringkas',
    };
    const parsed = AnnouncementSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('validates unit schema defaults', () => {
    const unit = {
      unitId: 'unit-test',
      unitCode: 'UT',
      unitName: 'Unit Ujian',
      title: 'Unit Ujian Sektor',
    };
    const parsed = UnitSchema.safeParse(unit);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.status).toBe('active');
      expect(parsed.data.hasDocuments).toBe(true);
    }
  });

  it('validates employee email formatting', () => {
    const validEmp = {
      unitId: 'unit-bm',
      name: 'Ahmad bin Ali',
      position: 'Pegawai SISC+',
      email: 'ahmad@moe.gov.my',
    };
    expect(EmployeeSchema.safeParse(validEmp).success).toBe(true);

    const invalidEmp = {
      unitId: 'unit-bm',
      name: 'Ahmad bin Ali',
      position: 'Pegawai SISC+',
      email: 'not-an-email',
    };
    expect(EmployeeSchema.safeParse(invalidEmp).success).toBe(false);
  });

  it('validates document schema requirements', () => {
    const validDoc = {
      unitId: 'unit-bm',
      title: 'Borang Penilaian 2026',
      fileId: 'drive-file-123',
      fileName: 'borang_penilaian.pdf',
    };
    const parsed = DocumentSchema.safeParse(validDoc);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.category).toBe('Dokumen');
      expect(parsed.data.status).toBe('active');
    }
  });
});
