'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Announcement,
  HeroSlide,
  Unit,
  UnitCategory,
  UnitContent,
  Employee,
  DocumentRecord,
  SystemInfo,
  AdminTab,
} from '@/types';
import { getErrorMessage } from '@/lib/errors';
import {
  ShieldCheck,
  LogOut,
  ArrowLeft,
  Bell,
  Image as ImageIcon,
  Folder,
  Layers,
  Users,
  FileText,
  Activity,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();

  // Authentication & Loading States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('hebahan');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Tab Data States
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [categories, setCategories] = useState<UnitCategory[]>([]);
  const [selectedUnitIdForContent, setSelectedUnitIdForContent] = useState<string>('');
  const [unitContentList, setUnitContentList] = useState<UnitContent[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedDocUnitFilter, setSelectedDocUnitFilter] = useState<string>('all');
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  // Form States (Inline Editors)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Partial<Announcement> | null>(null);
  const [editingUnit, setEditingUnit] = useState<Partial<Unit> | null>(null);
  const [editingContent, setEditingContent] = useState<Partial<UnitContent> | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee> | null>(null);
  const [editingDocument, setEditingDocument] = useState<Partial<DocumentRecord> | null>(null);

  // File Upload Processing States
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadUnitContent = useCallback(async (unitId: string) => {
    if (!unitId) return;
    try {
      const res = await fetch(`/api/admin/units/${unitId}/content`);
      const data = await res.json();
      if (data.success) {
        setUnitContentList(data.data);
      }
    } catch {}
  }, []);

  const loadAllData = useCallback(async () => {
    try {
      const [hebahanRes, albumRes, unitsRes, empRes, docRes, sysRes] = await Promise.all([
        fetch('/api/admin/announcements').then((r) => r.json()),
        fetch('/api/admin/hero-album').then((r) => r.json()),
        fetch('/api/admin/units').then((r) => r.json()),
        fetch('/api/admin/employees').then((r) => r.json()),
        fetch('/api/admin/documents').then((r) => r.json()),
        fetch('/api/admin/system-info').then((r) => r.json()),
      ]);

      if (hebahanRes.success) setAnnouncements(hebahanRes.data);
      if (albumRes.success) setHeroSlides(albumRes.data);
      if (unitsRes.success) {
        setUnits(unitsRes.data);
        if (unitsRes.data.length > 0) {
          setSelectedUnitIdForContent((prev) => {
            const current = prev || unitsRes.data[0].unitId;
            loadUnitContent(current);
            return current;
          });
        }
      }
      if (empRes.success) setEmployees(empRes.data);
      if (docRes.success) setDocuments(docRes.data);
      if (sysRes.success) setSystemInfo(sysRes.data);
    } catch (err) {
      console.error('Error loading admin data:', err);
    }
  }, [loadUnitContent]);

  // Verify Admin Session on mount
  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user?.role === 'admin') {
          setIsAuthenticated(true);
          loadAllData();
        } else {
          setIsAuthenticated(false);
        }
      })
      .catch(() => setIsAuthenticated(false));
  }, [loadAllData]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  // --- Base64 File Uploader Helper ---
  const handleFileUpload = async (
    file: File,
    folderId?: string
  ): Promise<{ fileId: string; viewUrl: string; directUrl: string; fileName: string } | null> => {
    setIsUploading(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64Data = await base64Promise;

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: base64Data,
          fileName: file.name,
          contentType: file.type,
          folderId,
        }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Muat naik gagal');
      }

      showToast(`Fail '${file.name}' berjaya dimuat naik ke Google Drive!`);
      return resData.data;
    } catch (err: unknown) {
      showToast(getErrorMessage(err) || 'Gagal memuat naik fail.', 'error');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // --- CRUD: Announcements ---
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnnouncement?.title) return;

    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingAnnouncement),
      });

      const resData = await res.json();
      if (resData.success) {
        showToast(resData.message || 'Hebahan disimpan.');
        setEditingAnnouncement(null);
        const refetch = await fetch('/api/admin/announcements').then((r) => r.json());
        if (refetch.success) setAnnouncements(refetch.data);
      } else {
        showToast(resData.error || 'Ralat menyimpan hebahan', 'error');
      }
    } catch {
      showToast('Ralat sambungan pelayan.', 'error');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Adakah anda pasti ingin memadam hebahan ini?')) return;
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Hebahan dipadam.');
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      }
    } catch {
      showToast('Gagal memadam.', 'error');
    }
  };

  // --- CRUD: Hero Album ---
  const handleAddHeroSlide = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploaded = await handleFileUpload(file);
    if (uploaded) {
      const newSlide: HeroSlide = {
        id: `ALB_${Date.now()}`,
        imageUrl: `https://lh3.googleusercontent.com/d/${uploaded.fileId}`,
        order: heroSlides.length + 1,
        fileName: file.name.replace(/\.[^/.]+$/, ''),
        createdAt: new Date().toISOString(),
      };

      const updated = [...heroSlides, newSlide];
      setHeroSlides(updated);
      await saveHeroAlbum(updated);
    }
  };

  const handleDeleteHeroSlide = async (id: string) => {
    const updated = heroSlides.filter((s) => s.id !== id).map((s, idx) => ({ ...s, order: idx + 1 }));
    setHeroSlides(updated);
    await saveHeroAlbum(updated);
  };

  const saveHeroAlbum = async (slides: HeroSlide[]) => {
    try {
      const res = await fetch('/api/admin/hero-album', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: slides }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Album berjaya dikemaskini.');
      }
    } catch {
      showToast('Gagal mengemas kini album.', 'error');
    }
  };

  // --- CRUD: Units ---
  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnit?.unitId || !editingUnit?.unitName) return;

    try {
      const res = await fetch('/api/admin/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUnit),
      });

      const resData = await res.json();
      if (resData.success) {
        showToast('Unit berjaya disimpan.');
        setEditingUnit(null);
        const refetch = await fetch('/api/admin/units').then((r) => r.json());
        if (refetch.success) setUnits(refetch.data);
      }
    } catch {
      showToast('Gagal menyimpan unit.', 'error');
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm(`Nyahaktifkan unit '${unitId}'?`)) return;
    try {
      const res = await fetch(`/api/admin/units/${unitId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Unit dinyahaktifkan.');
        setUnits((prev) => prev.filter((u) => u.unitId !== unitId));
      }
    } catch {
      showToast('Gagal menyahaktifkan unit.', 'error');
    }
  };

  // --- CRUD: Unit Content ---
  const handleSaveUnitContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContent?.title) return;

    try {
      const payload = { ...editingContent, unitId: selectedUnitIdForContent };
      const res = await fetch('/api/admin/units/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (resData.success) {
        showToast('Kandungan disimpan.');
        setEditingContent(null);
        loadUnitContent(selectedUnitIdForContent);
      }
    } catch {
      showToast('Gagal menyimpan kandungan.', 'error');
    }
  };

  const handleDeleteUnitContent = async (contentId: string) => {
    try {
      const res = await fetch(`/api/admin/units/content/${contentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Kandungan dipadam.');
        setUnitContentList((prev) => prev.filter((c) => c.contentId !== contentId));
      }
    } catch {
      showToast('Gagal memadam.', 'error');
    }
  };

  // --- CRUD: Employees ---
  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee?.name || !editingEmployee?.position) return;

    try {
      const res = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingEmployee),
      });

      const resData = await res.json();
      if (resData.success) {
        showToast('Maklumat pegawai disimpan.');
        setEditingEmployee(null);
        const refetch = await fetch('/api/admin/employees').then((r) => r.json());
        if (refetch.success) setEmployees(refetch.data);
      }
    } catch {
      showToast('Gagal menyimpan maklumat pegawai.', 'error');
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('Nyahaktifkan pegawai ini?')) return;
    try {
      const res = await fetch(`/api/admin/employees/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Pegawai dinyahaktifkan.');
        setEmployees((prev) => prev.filter((e) => e.employeeId !== id));
      }
    } catch {
      showToast('Gagal menyahaktifkan.', 'error');
    }
  };

  // --- CRUD: Documents ---
  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDocument?.title || !editingDocument?.fileId) return;

    try {
      const res = await fetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingDocument),
      });

      const resData = await res.json();
      if (resData.success) {
        showToast('Dokumen disimpan.');
        setEditingDocument(null);
        const refetch = await fetch('/api/admin/documents').then((r) => r.json());
        if (refetch.success) setDocuments(refetch.data);
      }
    } catch {
      showToast('Gagal menyimpan dokumen.', 'error');
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Padam rekod dokumen ini?')) return;
    try {
      const res = await fetch(`/api/admin/documents/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Dokumen dipadam.');
        setDocuments((prev) => prev.filter((d) => d.documentId !== id));
      }
    } catch {
      showToast('Gagal memadam.', 'error');
    }
  };

  const handleSyncDrive = async () => {
    setIsSyncingDrive(true);
    try {
      const res = await fetch('/api/admin/sync-drive', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Penyelarasan Google Drive selesai.');
        const refetch = await fetch('/api/admin/documents').then((r) => r.json());
        if (refetch.success) setDocuments(refetch.data);
      } else {
        showToast(data.error || 'Penyelarasan gagal.', 'error');
      }
    } catch {
      showToast('Ralat sambungan pelayan.', 'error');
    } finally {
      setIsSyncingDrive(false);
    }
  };

  const handleRunSetup = async () => {
    try {
      const res = await fetch('/api/admin/system-setup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Persediaan sistem berjaya disahkan.');
        loadAllData();
      }
    } catch {
      showToast('Ralat semasa menjalankan setup.', 'error');
    }
  };

  // Auth Guard Screen
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-gov-gold-400" />
        <p className="text-sm font-semibold tracking-wide">Mengesahkan sesi pentadbir...</p>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-gov-navy-950 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-gov-navy-900 rounded-3xl p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white">
            Akses Pentadbir Sahaja
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Sila kembali ke laman utama dan log masuk dengan kelayakan pentadbir yang sah.
          </p>
          <div className="pt-4">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gov-gold-500 hover:bg-gov-gold-600 text-gov-navy-950 font-bold text-sm shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Laman Utama</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-gov-navy-950 text-slate-800 dark:text-slate-100">
      {/* Top Admin Bar */}
      <header className="sticky top-0 z-40 bg-gov-navy-900 text-white shadow-md border-b border-gov-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg bg-gov-navy-800 hover:bg-gov-navy-700 text-slate-300 transition-colors"
              title="Kembali ke Portal Awam"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-6 h-6 text-gov-gold-400" />
              <h1 className="font-serif text-lg sm:text-xl font-bold tracking-tight">
                Panel Pengurusan E-SPb PPDB
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Keluar</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="bg-gov-navy-950 border-t border-gov-navy-800 overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4 flex space-x-1">
            {(
              [
                { id: 'hebahan', label: 'Hebahan', icon: Bell },
                { id: 'album', label: 'Hero Album', icon: ImageIcon },
                { id: 'units', label: 'Unit Sektor', icon: Folder },
                { id: 'content', label: 'Kandungan Unit', icon: Layers },
                { id: 'employees', label: 'Pegawai & Staf', icon: Users },
                { id: 'documents', label: 'Dokumen & Modul', icon: FileText },
                { id: 'system', label: 'Sistem & Audit', icon: Activity },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-gov-gold-400 text-gov-gold-400 bg-gov-navy-900/60'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Floating Toast Notification */}
      {feedback && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl flex items-center space-x-2.5 text-sm font-semibold animate-in slide-in-from-bottom-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Tab Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* TAB 1: HEBAHAN */}
        {activeTab === 'hebahan' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Pengurusan Hebahan Rasmi
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Tambah, sunting, dan padam notis atau pekeliling yang dipaparkan di portal awam.
                </p>
              </div>
              <button
                onClick={() =>
                  setEditingAnnouncement({
                    category: 'Hebahan',
                    date: new Date().toISOString().split('T')[0],
                  })
                }
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-gov-gold-500 hover:bg-gov-gold-600 text-gov-navy-950 font-bold text-xs sm:text-sm shadow-xs transition-all w-fit"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Hebahan Baharu</span>
              </button>
            </div>

            {/* Inline Editor Form */}
            {editingAnnouncement && (
              <div className="bg-white dark:bg-gov-navy-900 p-6 rounded-2xl border border-gov-gold-500/40 shadow-md animate-in fade-in duration-150">
                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">
                  {editingAnnouncement.id ? 'Sunting Hebahan' : 'Tambah Hebahan Baharu'}
                </h3>
                <form onSubmit={handleSaveAnnouncement} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                        Tarikh
                      </label>
                      <input
                        type="date"
                        required
                        value={editingAnnouncement.date || ''}
                        onChange={(e) =>
                          setEditingAnnouncement({ ...editingAnnouncement, date: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-gov-navy-950 border border-slate-200 dark:border-slate-800 text-xs focus:border-gov-gold-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                        Kategori
                      </label>
                      <select
                        value={editingAnnouncement.category || 'Hebahan'}
                        onChange={(e) =>
                          setEditingAnnouncement({ ...editingAnnouncement, category: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-gov-navy-950 border border-slate-200 dark:border-slate-800 text-xs focus:border-gov-gold-500 focus:outline-none"
                      >
                        <option value="Rasmi">Rasmi</option>
                        <option value="Program">Program</option>
                        <option value="Hebahan">Hebahan</option>
                        <option value="Pekeliling">Pekeliling</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                        Pautan Luaran (Pilihan)
                      </label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={editingAnnouncement.link || ''}
                        onChange={(e) =>
                          setEditingAnnouncement({ ...editingAnnouncement, link: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-gov-navy-950 border border-slate-200 dark:border-slate-800 text-xs focus:border-gov-gold-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                      Tajuk Hebahan
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Tajuk hebahan rasmi..."
                      value={editingAnnouncement.title || ''}
                      onChange={(e) =>
                        setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-gov-navy-950 border border-slate-200 dark:border-slate-800 text-xs focus:border-gov-gold-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                      Ringkasan / Kandungan Penuh
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Masukkan maklumat hebahan..."
                      value={editingAnnouncement.summary || ''}
                      onChange={(e) =>
                        setEditingAnnouncement({ ...editingAnnouncement, summary: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-gov-navy-950 border border-slate-200 dark:border-slate-800 text-xs focus:border-gov-gold-500 focus:outline-none"
                    />
                  </div>

                  {/* Image upload */}
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                      Imej Hebahan (Google Drive)
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const res = await handleFileUpload(file);
                            if (res) {
                              setEditingAnnouncement({
                                ...editingAnnouncement,
                                imageUrl: `https://lh3.googleusercontent.com/d/${res.fileId}`,
                              });
                            }
                          }
                        }}
                        className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gov-gold-500 file:text-gov-navy-950 hover:file:bg-gov-gold-600"
                      />
                      {editingAnnouncement.imageUrl && (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center space-x-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Imej Terpilih</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingAnnouncement(null)}
                      className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-gov-gold-500 hover:bg-gov-gold-600 text-gov-navy-950 text-xs font-bold shadow-sm"
                    >
                      Simpan Hebahan
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Announcements Table */}
            <div className="bg-white dark:bg-gov-navy-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-gov-navy-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="py-3 px-4">Tarikh</th>
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4">Tajuk</th>
                      <th className="py-3 px-4">Imej</th>
                      <th className="py-3 px-4 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {announcements.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-gov-navy-950/40">
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500">{a.date}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full bg-gov-gold-500/10 text-gov-gold-600 dark:text-gov-gold-400 font-semibold">
                            {a.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                          {a.title}
                        </td>
                        <td className="py-3 px-4">
                          {a.imageUrl ? (
                            <img
                              src={a.imageUrl}
                              alt=""
                              className="w-8 h-8 rounded-md object-cover border border-slate-200"
                            />
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                          <button
                            onClick={() => setEditingAnnouncement(a)}
                            className="p-1 rounded text-slate-500 hover:text-gov-gold-500"
                            title="Sunting"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAnnouncement(a.id)}
                            className="p-1 rounded text-slate-500 hover:text-red-500"
                            title="Padam"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HERO ALBUM */}
        {activeTab === 'album' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Pengurusan Album Sorotan Hero
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Slaid banner yang berpusing secara automatik di bahagian atas halaman portal.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <label className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-gov-gold-500 hover:bg-gov-gold-600 text-gov-navy-950 font-bold text-xs sm:text-sm shadow-xs transition-all">
                  <Upload className="w-4 h-4" />
                  <span>{isUploading ? 'Memuat Naik...' : 'Muat Naik Slaid Baharu'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAddHeroSlide}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Album Slides Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {heroSlides.map((slide, idx) => (
                <div
                  key={slide.id || idx}
                  className="bg-white dark:bg-gov-navy-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs flex flex-col justify-between"
                >
                  <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-950">
                    <img
                      src={slide.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/60 text-white text-xs font-bold">
                      #{slide.order || idx + 1}
                    </span>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                      {slide.fileName || `Slaid ${idx + 1}`}
                    </span>
                    <button
                      onClick={() => handleDeleteHeroSlide(slide.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50"
                      title="Padam slaid"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: UNITS */}
        {activeTab === 'units' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Pengurusan Unit & Sektor
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Daftar unit, kemas kini perincian kod, ikon, dan pautan Google Drive masing-masing.
                </p>
              </div>
              <button
                onClick={() =>
                  setEditingUnit({
                    categoryId: 'CAT_SOKONGAN',
                    status: 'active',
                    hasDocuments: true,
                    displayOrder: units.length + 1,
                  })
                }
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-gov-gold-500 hover:bg-gov-gold-600 text-gov-navy-950 font-bold text-xs sm:text-sm shadow-xs transition-all w-fit"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Unit Baharu</span>
              </button>
            </div>

            {/* Inline Unit Editor Form */}
            {editingUnit && (
              <div className="bg-white dark:bg-gov-navy-900 p-6 rounded-2xl border border-gov-gold-500/40 shadow-md">
                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">
                  {editingUnit.unitId ? 'Sunting Unit' : 'Tambah Unit Baharu'}
                </h3>
                <form onSubmit={handleSaveUnit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                        ID Unit (Unik)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="contoh: unit-bm"
                        value={editingUnit.unitId || ''}
                        onChange={(e) => setEditingUnit({ ...editingUnit, unitId: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-gov-navy-950 border border-slate-200 dark:border-slate-800 text-xs focus:border-gov-gold-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                        Kod Singkatan
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="contoh: BM"
                        value={editingUnit.unitCode || ''}
                        onChange={(e) => setEditingUnit({ ...editingUnit, unitCode: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-gov-navy-950 border border-slate-200 dark:border-slate-800 text-xs focus:border-gov-gold-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                        Kategori Sektor
                      </label>
                      <select
                        value={editingUnit.categoryId || 'CAT_SOKONGAN'}
                        onChange={(e) => setEditingUnit({ ...editingUnit, categoryId: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-gov-navy-950 border border-slate-200 dark:border-slate-800 text-xs focus:border-gov-gold-500 focus:outline-none"
                      >
                        <option value="CAT_SISC">SISC+ (School Improvement Specialist Coaches)</option>
                        <option value="CAT_SOKONGAN">Unit Sokongan & Pengurusan Pembelajaran</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                        Nama Unit
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="contoh: Unit Bahasa Melayu"
                        value={editingUnit.unitName || ''}
                        onChange={(e) => setEditingUnit({ ...editingUnit, unitName: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-gov-navy-950 border border-slate-200 dark:border-slate-800 text-xs focus:border-gov-gold-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                        Tajuk Penuh
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="contoh: Unit Bahasa Melayu – SISC+ Sektor Pembelajaran"
                        value={editingUnit.title || ''}
                        onChange={(e) => setEditingUnit({ ...editingUnit, title: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-gov-navy-950 border border-slate-200 dark:border-slate-800 text-xs focus:border-gov-gold-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                      Slogan / Tagline
                    </label>
                    <input
                      type="text"
                      placeholder="Slogan atau peranan ringkas..."
                      value={editingUnit.tagline || ''}
                      onChange={(e) => setEditingUnit({ ...editingUnit, tagline: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-gov-navy-950 border border-slate-200 dark:border-slate-800 text-xs focus:border-gov-gold-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                        ID Folder Google Drive
                      </label>
                      <input
                        type="text"
                        placeholder="contoh: 159M4lHFo2ev-qx5ZgH1LbxIGEKHsgOXE"
                        value={editingUnit.driveFolderId || ''}
                        onChange={(e) =>
                          setEditingUnit({ ...editingUnit, driveFolderId: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-gov-navy-950 border border-slate-200 dark:border-slate-800 text-xs focus:border-gov-gold-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                        Pautan Luar (Google Site dll)
                      </label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={editingUnit.externalLink || ''}
                        onChange={(e) =>
                          setEditingUnit({ ...editingUnit, externalLink: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-gov-navy-950 border border-slate-200 dark:border-slate-800 text-xs focus:border-gov-gold-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingUnit(null)}
                      className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-gov-gold-500 hover:bg-gov-gold-600 text-gov-navy-950 text-xs font-bold"
                    >
                      Simpan Unit
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Units Table */}
            <div className="bg-white dark:bg-gov-navy-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-gov-navy-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="py-3 px-4">Kod</th>
                      <th className="py-3 px-4">Nama Unit</th>
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4">Dokumen</th>
                      <th className="py-3 px-4">Folder Drive</th>
                      <th className="py-3 px-4 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {units.map((u) => (
                      <tr key={u.unitId} className="hover:bg-slate-50 dark:hover:bg-gov-navy-950/40">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {u.unitCode}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                          {u.unitName}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {u.categoryId === 'CAT_SISC' ? 'SISC+' : 'Unit Sokongan'}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {u.docsCount || 0} fail
                        </td>
                        <td className="py-3 px-4 text-slate-400 truncate max-w-[140px]">
                          {u.driveFolderId || '-'}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => setEditingUnit(u)}
                            className="p-1 rounded text-slate-500 hover:text-gov-gold-500"
                            title="Sunting"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUnit(u.unitId)}
                            className="p-1 rounded text-slate-500 hover:text-red-500"
                            title="Nyahaktif"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: UNIT CONTENT */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Pengurusan Kandungan & Peranan Unit
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Urus senarai fungsi/peranan dan perkhidmatan bimbingan bagi setiap unit.
                </p>
              </div>

              {/* Unit Selector */}
              <div className="flex items-center space-x-3">
                <select
                  value={selectedUnitIdForContent}
                  onChange={(e) => {
                    setSelectedUnitIdForContent(e.target.value);
                    loadUnitContent(e.target.value);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-gov-navy-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold focus:border-gov-gold-500 focus:outline-none"
                >
                  {units.map((u) => (
                    <option key={u.unitId} value={u.unitId}>
                      {u.unitName}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() =>
                    setEditingContent({
                      sectionType: 'responsibility',
                      displayOrder: unitContentList.length + 1,
                    })
                  }
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-gov-gold-500 hover:bg-gov-gold-600 text-gov-navy-950 font-bold text-xs sm:text-sm shadow-xs transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Item</span>
                </button>
              </div>
            </div>

            {/* Inline Content Editor */}
            {editingContent && (
              <div className="bg-white dark:bg-gov-navy-900 p-6 rounded-2xl border border-gov-gold-500/40 shadow-md">
                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">
                  {editingContent.contentId ? 'Sunting Item Kandungan' : 'Tambah Item Kandungan'}
                </h3>
                <form onSubmit={handleSaveUnitContent} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                        Jenis Bahagian
                      </label>
                      <select
                        value={editingContent.sectionType || 'responsibility'}
                        onChange={(e) =>
                          setEditingContent({ ...editingContent, sectionType: e.target.value as UnitContent['sectionType'] })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-gov-navy-950 border border-slate-200 dark:border-slate-800 text-xs focus:border-gov-gold-500 focus:outline-none"
                      >
                        <option value="responsibility">Fungsi & Peranan Utama</option>
                        <option value="service">Perkhidmatan & Khidmat Bimbingan</option>
                        <option value="custom">Kandungan Khas</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                        Susunan (Nombor)
                      </label>
                      <input
                        type="number"
                        value={editingContent.displayOrder || 1}
                        onChange={(e) =>
                          setEditingContent({
                            ...editingContent,
                            displayOrder: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-gov-navy-950 border border-slate-200 dark:border-slate-800 text-xs focus:border-gov-gold-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                      Teks Peranan / Tajuk Kandungan
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Masukkan peranan atau nama perkhidmatan..."
                      value={editingContent.title || ''}
                      onChange={(e) =>
                        setEditingContent({ ...editingContent, title: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-gov-navy-950 border border-slate-200 dark:border-slate-800 text-xs focus:border-gov-gold-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingContent(null)}
                      className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-gov-gold-500 hover:bg-gov-gold-600 text-gov-navy-950 text-xs font-bold"
                    >
                      Simpan Item
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Content List Table */}
            <div className="bg-white dark:bg-gov-navy-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-gov-navy-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="py-3 px-4">Susunan</th>
                      <th className="py-3 px-4">Bahagian</th>
                      <th className="py-3 px-4">Kandungan</th>
                      <th className="py-3 px-4 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {unitContentList.map((c) => (
                      <tr key={c.contentId} className="hover:bg-slate-50 dark:hover:bg-gov-navy-950/40">
                        <td className="py-3 px-4 text-slate-400">#{c.displayOrder}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full font-semibold ${
                              c.sectionType === 'responsibility'
                                ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300'
                                : 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-300'
                            }`}
                          >
                            {c.sectionType === 'responsibility' ? 'Peranan' : 'Perkhidmatan'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                          {c.title}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => setEditingContent(c)}
                            className="p-1 rounded text-slate-500 hover:text-gov-gold-500"
                            title="Sunting"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUnitContent(c.contentId)}
                            className="p-1 rounded text-slate-500 hover:text-red-500"
                            title="Padam"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: EMPLOYEES */}
        {activeTab === 'employees' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Pengurusan Direktori Pegawai
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Daftar pegawai, tetapkan unit sektor, gambar profil dan peranan akses sistem.
                </p>
              </div>
              <button
                onClick={() =>
                  setEditingEmployee({
                    unitId: units[0]?.unitId || '',
                    accessRole: 'staff',
                    status: 'active',
                    displayOrder: employees.length + 1,
                  })
                }
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-gov-gold-500 hover:bg-gov-gold-600 text-gov-navy-950 font-bold text-xs sm:text-sm shadow-xs transition-all w-fit"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Pegawai Baharu</span>
              </button>
            </div>

            {/* Inline Employee Editor Form */}
            {editingEmployee && (
              <div className="bg-white dark:bg-gov-navy-900 p-6 rounded-2xl border border-gov-gold-500/40 shadow-md">
                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">
                  {editingEmployee.employeeId ? 'Sunting Pegawai' : 'Tambah Pegawai Baharu'}
                </h3>
                <form onSubmit={handleSaveEmployee} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                        Nama Penuh Pegawai
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Nama dan gelaran..."
                        value={editingEmployee.name || ''}
                        onChange={(e) =>
                          setEditingEmployee({ ...editingEmployee, name: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-gov-navy-950 border border-slate-200 dark:border-slate-800 text-xs focus:border-gov-gold-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                        Jawatan / Gelaran
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="contoh: Pegawai SISC+ Bahasa Melayu"
                        value={editingEmployee.position || ''}
                        onChange={(e) =>
                          setEditingEmployee({ ...editingEmployee, position: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-gov-navy-950 border border-slate-200 dark:border-slate-800 text-xs focus:border-gov-gold-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                        Unit Sektor
                      </label>
                      <select
                        value={editingEmployee.unitId || ''}
                        onChange={(e) =>
                          setEditingEmployee({ ...editingEmployee, unitId: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-gov-navy-950 border border-slate-200 dark:border-slate-800 text-xs focus:border-gov-gold-500 focus:outline-none"
                      >
                        {units.map((u) => (
                          <option key={u.unitId} value={u.unitId}>
                            {u.unitName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                        E-mel Rasmi (@moe.gov.my)
                      </label>
                      <input
                        type="email"
                        placeholder="nama@moe.gov.my"
                        value={editingEmployee.email || ''}
                        onChange={(e) =>
                          setEditingEmployee({ ...editingEmployee, email: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-gov-navy-950 border border-slate-200 dark:border-slate-800 text-xs focus:border-gov-gold-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                        Peranan Akses
                      </label>
                      <select
                        value={editingEmployee.accessRole || 'staff'}
                        onChange={(e) =>
                          setEditingEmployee({
                            ...editingEmployee,
                            accessRole: e.target.value as Employee['accessRole'],
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-gov-navy-950 border border-slate-200 dark:border-slate-800 text-xs focus:border-gov-gold-500 focus:outline-none"
                      >
                        <option value="staff">Pegawai / Staf</option>
                        <option value="admin">Pentadbir Sistem (Admin)</option>
                      </select>
                    </div>
                  </div>

                  {/* Photo upload */}
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                      Gambar Profil (Google Drive)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const res = await handleFileUpload(file);
                          if (res) {
                            setEditingEmployee({
                              ...editingEmployee,
                              photoFileId: res.fileId,
                            });
                          }
                        }
                      }}
                      className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gov-gold-500 file:text-gov-navy-950"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingEmployee(null)}
                      className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-gov-gold-500 hover:bg-gov-gold-600 text-gov-navy-950 text-xs font-bold"
                    >
                      Simpan Pegawai
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Employees Table */}
            <div className="bg-white dark:bg-gov-navy-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-gov-navy-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="py-3 px-4">Nama</th>
                      <th className="py-3 px-4">Jawatan</th>
                      <th className="py-3 px-4">Unit</th>
                      <th className="py-3 px-4">E-mel</th>
                      <th className="py-3 px-4">Peranan</th>
                      <th className="py-3 px-4 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {employees.map((emp) => (
                      <tr key={emp.employeeId} className="hover:bg-slate-50 dark:hover:bg-gov-navy-950/40">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {emp.name}
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                          {emp.position}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {units.find((u) => u.unitId === emp.unitId)?.unitName || emp.unitId}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{emp.email || '-'}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full font-semibold ${
                              emp.accessRole === 'admin'
                                ? 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {emp.accessRole}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => setEditingEmployee(emp)}
                            className="p-1 rounded text-slate-500 hover:text-gov-gold-500"
                            title="Sunting"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(emp.employeeId)}
                            className="p-1 rounded text-slate-500 hover:text-red-500"
                            title="Padam"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Pengurusan Dokumen & Repositori Modul
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Muat naik fail terus ke Google Drive unit dan selaraskan pangkalan data dokumen.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSyncDrive}
                  disabled={isSyncingDrive}
                  className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-gov-navy-800 hover:bg-slate-300 dark:hover:bg-gov-navy-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all disabled:opacity-50"
                  title="Imbas folder Google Drive unit dan masukkan fail yang belum ada dalam rekod"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDrive ? 'animate-spin' : ''}`} />
                  <span>{isSyncingDrive ? 'Menyelaras...' : 'Selaraskan Fail Drive'}</span>
                </button>

                <button
                  onClick={() =>
                    setEditingDocument({
                      unitId: units[0]?.unitId || '',
                      category: 'Dokumen',
                      status: 'active',
                      displayOrder: documents.length + 1,
                    })
                  }
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-gov-gold-500 hover:bg-gov-gold-600 text-gov-navy-950 font-bold text-xs sm:text-sm shadow-xs transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Dokumen</span>
                </button>
              </div>
            </div>

            {/* Filter by unit */}
            <div className="flex items-center space-x-3">
              <span className="text-xs font-semibold text-slate-500">Tapis Unit:</span>
              <select
                value={selectedDocUnitFilter}
                onChange={(e) => setSelectedDocUnitFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-gov-navy-900 border border-slate-200 dark:border-slate-800 text-xs font-medium"
              >
                <option value="all">Semua Unit</option>
                {units.map((u) => (
                  <option key={u.unitId} value={u.unitId}>
                    {u.unitName}
                  </option>
                ))}
              </select>
            </div>

            {/* Inline Document Editor Form */}
            {editingDocument && (
              <div className="bg-white dark:bg-gov-navy-900 p-6 rounded-2xl border border-gov-gold-500/40 shadow-md">
                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">
                  {editingDocument.documentId ? 'Sunting Dokumen' : 'Tambah Dokumen Baharu'}
                </h3>
                <form onSubmit={handleSaveDocument} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                        Unit Pemilik
                      </label>
                      <select
                        value={editingDocument.unitId || ''}
                        onChange={(e) =>
                          setEditingDocument({ ...editingDocument, unitId: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-gov-navy-950 border border-slate-200 dark:border-slate-800 text-xs focus:border-gov-gold-500 focus:outline-none"
                      >
                        {units.map((u) => (
                          <option key={u.unitId} value={u.unitId}>
                            {u.unitName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                        Kategori Dokumen
                      </label>
                      <input
                        type="text"
                        placeholder="contoh: DSKP, Modul, Borang, Panduan"
                        value={editingDocument.category || 'Dokumen'}
                        onChange={(e) =>
                          setEditingDocument({ ...editingDocument, category: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-gov-navy-950 border border-slate-200 dark:border-slate-800 text-xs focus:border-gov-gold-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                        ID Fail Google Drive
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="ID fail Drive..."
                        value={editingDocument.fileId || ''}
                        onChange={(e) =>
                          setEditingDocument({ ...editingDocument, fileId: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-gov-navy-950 border border-slate-200 dark:border-slate-800 text-xs focus:border-gov-gold-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                      Tajuk Dokumen
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Tajuk rasmi dokumen..."
                      value={editingDocument.title || ''}
                      onChange={(e) =>
                        setEditingDocument({ ...editingDocument, title: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-gov-navy-950 border border-slate-200 dark:border-slate-800 text-xs focus:border-gov-gold-500 focus:outline-none"
                    />
                  </div>

                  {/* Direct PDF / Document Upload */}
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                      Muat Naik Fail Terus ke Google Drive (PDF / Word / Excel)
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="file"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const unitFolder = units.find(
                              (u) => u.unitId === editingDocument.unitId
                            )?.driveFolderId;
                            const res = await handleFileUpload(file, unitFolder);
                            if (res) {
                              setEditingDocument({
                                ...editingDocument,
                                fileId: res.fileId,
                                fileName: res.fileName,
                                title:
                                  editingDocument.title ||
                                  file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
                              });
                            }
                          }
                        }}
                        className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gov-gold-500 file:text-gov-navy-950"
                      />
                      {editingDocument.fileName && (
                        <span className="text-xs text-slate-500 truncate max-w-xs">
                          {editingDocument.fileName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingDocument(null)}
                      className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-gov-gold-500 hover:bg-gov-gold-600 text-gov-navy-950 text-xs font-bold"
                    >
                      Simpan Dokumen
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Documents Table */}
            <div className="bg-white dark:bg-gov-navy-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-gov-navy-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="py-3 px-4">Tajuk Dokumen</th>
                      <th className="py-3 px-4">Unit</th>
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4">Saiz</th>
                      <th className="py-3 px-4">Pautan Drive</th>
                      <th className="py-3 px-4 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {documents
                      .filter(
                        (d) => selectedDocUnitFilter === 'all' || d.unitId === selectedDocUnitFilter
                      )
                      .map((doc) => (
                        <tr key={doc.documentId} className="hover:bg-slate-50 dark:hover:bg-gov-navy-950/40">
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                            {doc.title}
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {units.find((u) => u.unitId === doc.unitId)?.unitName || doc.unitId}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full bg-gov-gold-500/10 text-gov-gold-600 dark:text-gov-gold-400 font-semibold">
                              {doc.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400">{doc.fileSize}</td>
                          <td className="py-3 px-4">
                            <a
                              href={`https://drive.google.com/file/d/${doc.fileId}/preview`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gov-gold-600 hover:underline inline-flex items-center space-x-1"
                            >
                              <span>Buka Fail</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => setEditingDocument(doc)}
                              className="p-1 rounded text-slate-500 hover:text-gov-gold-500"
                              title="Sunting"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(doc.documentId)}
                              className="p-1 rounded text-slate-500 hover:text-red-500"
                              title="Padam"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: SYSTEM & AUDIT */}
        {activeTab === 'system' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Status Sistem & Log Audit
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Gambaran keseluruhan pangkalan data dan rekod aktiviti keselamatan portal.
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gov-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-xs text-slate-400 font-semibold uppercase">Unit Sektor</span>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {systemInfo?.unitCount || units.length}
                </p>
              </div>
              <div className="bg-white dark:bg-gov-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-xs text-slate-400 font-semibold uppercase">Pegawai & Staf</span>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {systemInfo?.employeeCount || employees.length}
                </p>
              </div>
              <div className="bg-white dark:bg-gov-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-xs text-slate-400 font-semibold uppercase">Fail Dokumen</span>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {systemInfo?.documentCount || documents.length}
                </p>
              </div>
              <div className="bg-white dark:bg-gov-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-xs text-slate-400 font-semibold uppercase">Hebahan Aktif</span>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {systemInfo?.announcementCount || announcements.length}
                </p>
              </div>
            </div>

            {/* System Setup Box */}
            <div className="bg-white dark:bg-gov-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Persediaan Folder Google Drive & Database
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Mengesahkan folder 01_Pangkalan_Data, 02_Unit_Sektor, 03_Hebahan, dan spreadsheet utama.
                </p>
              </div>
              <button
                onClick={handleRunSetup}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-gov-gold-500 text-white dark:text-gov-navy-950 font-bold text-xs"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Sahkan & Selaraskan Struktur</span>
              </button>
            </div>

            {/* Audit Log Table */}
            <div className="bg-white dark:bg-gov-navy-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Log Audit Terkini (SHEET_AUDIT_LOG)
                </h3>
                <span className="text-xs text-slate-400">20 aktiviti terkini</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-gov-navy-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="py-3 px-4">Masa (Timestamp)</th>
                      <th className="py-3 px-4">Tindakan</th>
                      <th className="py-3 px-4">Pengguna</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Perincian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-xs">
                    {(systemInfo?.auditLogs || []).map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-gov-navy-950/40">
                        <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString('ms-MY') : '-'}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-gov-gold-600 dark:text-gov-gold-400 whitespace-nowrap">
                          {log.action}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {log.user}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              log.status === 'SUCCESS'
                                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300'
                                : 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-300'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 font-sans truncate max-w-sm">
                          {log.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
