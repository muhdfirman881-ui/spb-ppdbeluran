'use client';

import React, { useState, useMemo } from 'react';
import { UnitPortalData, DocumentRecord } from '@/types';
import {
  ArrowLeft,
  FileText,
  Search,
  Eye,
  Download,
  Users,
  Camera,
  ExternalLink,
  FolderOpen,
} from 'lucide-react';
import { getOptimizedImageUrl, extractGoogleDriveFileId } from '@/lib/config';

interface UnitDetailViewProps {
  unitData: UnitPortalData;
  onBack: () => void;
  onPreviewDocument: (doc: DocumentRecord) => void;
}

export const UnitDetailView: React.FC<UnitDetailViewProps> = ({
  unitData,
  onBack,
  onPreviewDocument,
}) => {
  const {
    unit,
    documents = [],
  } = unitData;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocCategory, setSelectedDocCategory] = useState('Semua');

  // Team Photo URL detection
  const rawPhoto = unit.teamPhotoUrl || unit.bannerFileId || unit.logoFileId || '';
  const teamPhotoSource = getOptimizedImageUrl(rawPhoto);

  // Extract unique document categories
  const docCategories = useMemo(() => {
    const cats = new Set<string>();
    documents.forEach((d) => {
      if (d.category) cats.add(d.category);
    });
    return ['Semua', ...Array.from(cats)];
  }, [documents]);

  // Filter documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchCat =
        selectedDocCategory === 'Semua' || doc.category.toLowerCase() === selectedDocCategory.toLowerCase();
      const matchSearch =
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [documents, selectedDocCategory, searchQuery]);

  return (
    <div className="py-5 sm:py-10 lg:py-12 bg-slate-50 dark:bg-gov-navy-950 min-h-screen transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5 sm:space-y-8 lg:space-y-10">
        {/* Back Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white dark:bg-gov-navy-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-gov-gold-600 dark:hover:text-gov-gold-400 hover:border-gov-gold-500/50 shadow-xs transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Senarai Unit</span>
          </button>

          {unit.externalLink && (
            <a
              href={unit.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 sm:space-x-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gov-gold-500 hover:bg-gov-gold-600 text-gov-navy-950 text-xs sm:text-sm font-bold shadow-xs transition-all"
            >
              <span>Portal Luaran Unit</span>
              <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </a>
          )}
        </div>

        {/* Unit Hero Banner */}
        <div className="bg-white dark:bg-gov-navy-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-8 lg:p-10 shadow-sm relative overflow-hidden">
          <div className="relative z-10 max-w-4xl">

            <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-extrabold text-gov-navy-900 dark:text-white tracking-tight leading-tight">
              {unit.title || unit.unitName}
            </h1>
            <p className="mt-2 sm:mt-3 text-sm sm:text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              {unit.tagline}
            </p>
            {unit.description && unit.description !== unit.tagline && (
              <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3 sm:pt-4">
                {unit.description}
              </p>
            )}
          </div>
        </div>



        {/* Unit Team Photo Showcase (Tempat Gambar Tenaga Unit) */}
        <div className="bg-white dark:bg-gov-navy-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 lg:p-8 shadow-xs space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 sm:pb-4">
            <div className="flex items-center space-x-2 sm:space-x-2.5 text-gov-navy-900 dark:text-white font-bold text-base sm:text-lg">
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-gov-gold-500" />
              <span>Gambar Tenaga Kerja Unit</span>
            </div>
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
              Warga &amp; Barisan Pegawai {unit.unitName}
            </span>
          </div>

          {/* Photo Display Card - Precisely calibrated for 1920 x 720 px */}
          {teamPhotoSource ? (
            <div className="relative w-full aspect-[1920/720] rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 group shadow-sm">
              <img
                src={teamPhotoSource}
                alt={`Gambar Tenaga Kerja ${unit.unitName}`}
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover object-center group-hover:scale-[1.01] transition-transform duration-500"
                onError={(e) => {
                  const target = e.currentTarget;
                  const driveId = extractGoogleDriveFileId(rawPhoto);
                  if (driveId && !target.dataset.triedFallback) {
                    target.dataset.triedFallback = 'true';
                    target.src = `https://lh3.googleusercontent.com/d/${driveId}`;
                  } else {
                    target.style.display = 'none';
                  }
                }}
              />
              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-5 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-center justify-between pointer-events-none">
                <span className="text-[11px] sm:text-sm font-semibold text-white drop-shadow truncate pr-2">
                  Foto Rasmi Tenaga Kerja {unit.unitName}
                </span>
                <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full bg-gov-gold-500 text-gov-navy-950 font-bold shadow-xs shrink-0">
                  Sektor Pembelajaran
                </span>
              </div>
            </div>
          ) : (
            <div className="relative w-full min-h-[140px] sm:min-h-[200px] sm:aspect-[1920/720] rounded-xl sm:rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-5 sm:p-10 text-center bg-slate-50/60 dark:bg-gov-navy-950/40 flex flex-col items-center justify-center">
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-gov-gold-500/10 flex items-center justify-center mx-auto mb-2.5 sm:mb-3 text-gov-gold-500">
                <Users className="w-5 h-5 sm:w-7 sm:h-7" />
              </div>
              <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white">
                Foto Rasmi Tenaga Kerja {unit.unitName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                Belum ada foto rasmi tenaga kerja dimuat naik untuk unit ini.
              </p>
            </div>
          )}
        </div>

        {/* Document Repository */}
        {(unit.hasDocuments || documents.length > 0) && (
          <div className="bg-white dark:bg-gov-navy-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 lg:p-8 shadow-xs space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-2.5 text-gov-navy-900 dark:text-white font-bold text-lg">
                <FolderOpen className="w-5 h-5 text-gov-gold-500" />
                <span>Repositori Dokumen & Modul</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-gov-gold-500/15 text-gov-gold-600 dark:text-gov-gold-400 font-bold ml-1">
                  {documents.length} Fail
                </span>
              </div>

              {/* Search Bar */}
              {documents.length > 0 && (
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari dokumen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-gov-navy-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:border-gov-gold-500 transition-colors"
                  />
                </div>
              )}
            </div>

            {/* Category Filter Tabs */}
            {docCategories.length > 1 && (
              <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-slate-100 dark:border-slate-800">
                {docCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedDocCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedDocCategory === cat
                        ? 'bg-gov-gold-500 text-gov-navy-950 font-bold shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Documents List */}
            {documents.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-gov-navy-950/40">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 text-gov-gold-500" />
                <h4 className="font-bold text-base text-slate-800 dark:text-white mb-1">
                  Repositori Dokumen {unit.unitName}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Pekeliling, modul pedagogi, instrumen dan garis panduan bagi unit ini sedang dikemaskini. Pegawai unit boleh memuat naik fail PDF terus ke Google Drive melalui Panel Pentadbir.
                </p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-2xl bg-slate-50 dark:bg-gov-navy-950/40 border border-slate-200 dark:border-slate-800">
                <Search className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Tiada dokumen ditemui untuk carian &quot;{searchQuery}&quot;
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedDocCategory('Semua');
                  }}
                  className="mt-3 text-xs font-bold text-gov-gold-600 dark:text-gov-gold-400 hover:underline"
                >
                  Set semula tapisan carian
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDocuments.map((doc) => {
                  const isPdf =
                    doc.fileType?.toLowerCase().includes('pdf') ||
                    doc.fileName?.toLowerCase().endsWith('.pdf');
                  return (
                    <div
                      key={doc.documentId}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-gov-navy-950/60 hover:bg-white dark:hover:bg-gov-navy-900 hover:border-gov-gold-500/50 hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      <div
                        onClick={() => onPreviewDocument(doc)}
                        className="cursor-pointer flex items-start space-x-3 min-w-0"
                      >
                        <div className="p-2.5 rounded-xl bg-gov-gold-500/10 text-gov-gold-600 dark:text-gov-gold-400 group-hover:scale-105 group-hover:bg-gov-gold-500 group-hover:text-gov-navy-950 transition-all flex-shrink-0 mt-0.5">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-gov-gold-500/15 text-gov-gold-600 dark:text-gov-gold-400">
                              {isPdf ? 'PDF' : doc.fileType || 'DOKUMEN'}
                            </span>
                            {doc.category && (
                              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 truncate">
                                &bull; {doc.category}
                              </span>
                            )}
                          </div>
                          <h5 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-gov-gold-600 dark:group-hover:text-gov-gold-400 transition-colors mt-1 line-clamp-2">
                            {doc.title}
                          </h5>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                            {doc.fileName} &bull; {doc.fileSize}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80">
                        <button
                          onClick={() => onPreviewDocument(doc)}
                          className="inline-flex items-center space-x-1.5 text-xs font-bold text-gov-gold-600 dark:text-gov-gold-400 hover:text-gov-gold-500 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat Dokumen</span>
                        </button>

                        <div className="flex items-center space-x-1">
                          <a
                            href={`/api/files/${doc.fileId}?download=true`}
                            download={doc.fileName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-gov-navy-950 hover:bg-gov-gold-500 transition-colors"
                            title="Muat Turun Fail"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <a
                            href={`https://drive.google.com/file/d/${doc.fileId}/view`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-gov-gold-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Buka di Google Drive"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
