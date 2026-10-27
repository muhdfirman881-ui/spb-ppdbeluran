import { describe, it, expect } from 'vitest';
import { GoogleSheetsService } from '@/lib/google-sheets';

describe('Google Sheets Service & Database Operations', () => {
  it('retrieves active announcements list', async () => {
    const list = await GoogleSheetsService.getAnnouncements();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]).toHaveProperty('title');
    expect(list[0]).toHaveProperty('category');
  });

  it('performs full CRUD cycle on announcements', async () => {
    // 1. Create
    const newAnnouncement = await GoogleSheetsService.saveAnnouncement({
      title: 'Ujian Pengumuman Automatik',
      summary: 'Kandungan ujian operasi pangkalan data.',
      category: 'Program',
      date: '2026-05-01',
    });
    expect(newAnnouncement.id).toBeDefined();

    // 2. Read
    let all = await GoogleSheetsService.getAnnouncements();
    const found = all.find((a) => a.id === newAnnouncement.id);
    expect(found).toBeDefined();
    expect(found?.title).toBe('Ujian Pengumuman Automatik');

    // 3. Update
    await GoogleSheetsService.saveAnnouncement({
      id: newAnnouncement.id,
      title: 'Tajuk Telah Dikemaskini',
      summary: 'Ringkasan baharu.',
    });
    all = await GoogleSheetsService.getAnnouncements();
    const updated = all.find((a) => a.id === newAnnouncement.id);
    expect(updated?.title).toBe('Tajuk Telah Dikemaskini');

    // 4. Delete
    const deleted = await GoogleSheetsService.deleteAnnouncement(newAnnouncement.id);
    expect(deleted).toBe(true);
    all = await GoogleSheetsService.getAnnouncements();
    expect(all.find((a) => a.id === newAnnouncement.id)).toBeUndefined();
  });

  it('retrieves sector units and categories', async () => {
    const units = await GoogleSheetsService.getUnits();
    const categories = await GoogleSheetsService.getCategories();

    expect(Array.isArray(units)).toBe(true);
    expect(units.length).toBeGreaterThanOrEqual(7);
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBe(2);

    // Verify SISC+ and Sokongan categorization
    const siscUnits = units.filter((u) => u.categoryId === 'CAT_SISC');
    expect(siscUnits.length).toBeGreaterThanOrEqual(4);
  });

  it('records audit log entries', async () => {
    await GoogleSheetsService.logAudit('TEST_ACTION', 'TEST_USER', 'SUCCESS', 'Perincian ujian sistem.');
    const info = await GoogleSheetsService.getSystemInfo();
    expect(info.auditLogs).toBeDefined();
    expect(info.auditLogs.length).toBeGreaterThan(0);
    expect(info.auditLogs[0].action).toBe('TEST_ACTION');
    expect(info.auditLogs[0].user).toBe('TEST_USER');
  });
});
