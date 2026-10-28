'use client';

import React from 'react';
import {
  FileSpreadsheet,
  GraduationCap,
  Award,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { DocumentRecord } from '@/types';

interface SectorStatsSectionProps {
  onPreviewDocument?: (doc: DocumentRecord) => void;
}

export const SectorStatsSection: React.FC<SectorStatsSectionProps> = ({
  onPreviewDocument,
}) => {
  const ippkDoc: DocumentRecord = {
    documentId: '1pgomDtyB-4YcQBhJ4-VqO7Ytn-vToz-F',
    fileId: '1pgomDtyB-4YcQBhJ4-VqO7Ytn-vToz-F',
    unitId: 'kurikulum',
    title: 'DATA IPPK BIL. 1 TAHUN 2026 PPD BELURAN',
    fileName: 'DATA_IPPK_BIL_1_2026_PPD_BELURAN.pdf',
    fileType: 'pdf',
    fileSize: 'PDF',
    category: 'Data & Laporan Kurikulum',
    description: 'Laporan dan analisis Instrumen Pemantauan Pengurusan Kurikulum (IPPK) PPD Beluran.',
    displayOrder: 1,
    status: 'active',
    uploadedAt: new Date().toISOString(),
  };

  const gredPurataDoc: DocumentRecord = {
    documentId: '1WLFAd4JT9yNI7J_eOPscOCQonYUZvTAn',
    fileId: '1WLFAd4JT9yNI7J_eOPscOCQonYUZvTAn',
    unitId: 'peperiksaan',
    title: 'GRED PURATA SPM PPD BELURAN',
    fileName: 'GRED_PURATA_SPM_PPD_BELURAN.pdf',
    fileType: 'pdf',
    fileSize: 'PDF',
    category: 'Analisis Peperiksaan Awam',
    description: 'Pencapaian Gred Purata Daerah (GPD) calon Sijil Pelajaran Malaysia daerah Beluran.',
    displayOrder: 2,
    status: 'active',
    uploadedAt: new Date().toISOString(),
  };

  const purataLulusDoc: DocumentRecord = {
    documentId: '1LkxOVM5U9rRZiic8uX59ZUO4xm-kCutn',
    fileId: '1LkxOVM5U9rRZiic8uX59ZUO4xm-kCutn',
    unitId: 'peperiksaan',
    title: 'PURATA LULUS MATA PELAJARAN TERAS SPM PPD BELURAN',
    fileName: 'PURATA_LULUS_MATA_PELAJARAN_TERAS_SPM.pdf',
    fileType: 'pdf',
    fileSize: 'PDF',
    category: 'Analisis Peperiksaan Awam',
    description: 'Kadar kelulusan & penguasaan bagi mata pelajaran SPM seluruh daerah Beluran.',
    displayOrder: 3,
    status: 'active',
    uploadedAt: new Date().toISOString(),
  };

  const handleOpenIppk = () => {
    if (onPreviewDocument) {
      onPreviewDocument(ippkDoc);
    } else {
      window.open(
        'https://drive.google.com/file/d/1pgomDtyB-4YcQBhJ4-VqO7Ytn-vToz-F/view?usp=drive_link',
        '_blank'
      );
    }
  };

  const handleOpenGredPurata = () => {
    if (onPreviewDocument) {
      onPreviewDocument(gredPurataDoc);
    } else {
      window.open(
        'https://drive.google.com/file/d/1WLFAd4JT9yNI7J_eOPscOCQonYUZvTAn/view?usp=drive_link',
        '_blank'
      );
    }
  };

  const handleOpenPurataLulus = () => {
    if (onPreviewDocument) {
      onPreviewDocument(purataLulusDoc);
    } else {
      window.open(
        'https://drive.google.com/file/d/1LkxOVM5U9rRZiic8uX59ZUO4xm-kCutn/view?usp=drive_link',
        '_blank'
      );
    }
  };

  return (
    <section className="relative z-20 py-5 sm:py-8 lg:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Horizontal snap-scroll strip on mobile (<640px) so 3 cards take 1 compact row instead of stacking 3 tall blocks; 3-col grid on sm+ */}
      <div className="flex sm:grid sm:grid-cols-3 overflow-x-auto sm:overflow-visible snap-x snap-mandatory gap-3.5 sm:gap-5 lg:gap-6 pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
        {/* KAD 1: DATA IPPK */}
        <div
          onClick={handleOpenIppk}
          className="min-w-[260px] max-w-[285px] sm:min-w-0 sm:max-w-none shrink-0 snap-center group relative bg-white dark:bg-gov-navy-900 rounded-2xl p-4 sm:p-6 lg:p-7 border border-slate-200/90 dark:border-slate-800 shadow-md sm:shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer flex flex-col justify-between"
        >
          {/* Top accent line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-gov-gold-500/20 via-gov-gold-500 to-gov-gold-500/20 opacity-70 group-hover:opacity-100 transition-opacity" />

          {/* Background subtle watermark */}
          <div className="absolute -right-3 -bottom-3 opacity-5 dark:opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
            <FileSpreadsheet className="w-20 h-20 sm:w-28 sm:h-28 text-gov-gold-500" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gov-gold-500/10 dark:bg-gov-navy-950 border border-gov-gold-500/20 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6 text-gov-gold-500" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 sm:py-1 rounded-full bg-gov-gold-500/15 text-gov-gold-600 dark:text-gov-gold-400 border border-gov-gold-500/30">
                Pemantauan Kurikulum
              </span>
            </div>

            <div className="flex items-baseline space-x-1.5">
              <span className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gov-navy-900 dark:text-white tracking-tight">
                Bil. 1
              </span>
              <span className="text-xs font-semibold text-gov-gold-600 dark:text-gov-gold-400">
                / 2026
              </span>
            </div>

            <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white mt-1 sm:mt-1.5 leading-snug group-hover:text-gov-gold-600 dark:group-hover:text-gov-gold-400 transition-colors">
              Data IPPK
            </h4>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              Instrumen Pemantauan Pengurusan Kurikulum sekolah-sekolah daerah Beluran.
            </p>
          </div>

          <div className="mt-4 sm:mt-5 pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-gov-gold-600 dark:text-gov-gold-400">
            <span>Lihat Dokumen</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* KAD 2: GRED PURATA SPM */}
        <div
          onClick={handleOpenGredPurata}
          className="min-w-[260px] max-w-[285px] sm:min-w-0 sm:max-w-none shrink-0 snap-center group relative bg-white dark:bg-gov-navy-900 rounded-2xl p-4 sm:p-6 lg:p-7 border border-slate-200/90 dark:border-slate-800 shadow-md sm:shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer flex flex-col justify-between"
        >
          {/* Top accent line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-gov-gold-500/20 via-gov-gold-500 to-gov-gold-500/20 opacity-70 group-hover:opacity-100 transition-opacity" />

          {/* Background subtle watermark */}
          <div className="absolute -right-3 -bottom-3 opacity-5 dark:opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
            <GraduationCap className="w-20 h-20 sm:w-28 sm:h-28 text-gov-gold-500" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gov-gold-500/10 dark:bg-gov-navy-950 border border-gov-gold-500/20 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-gov-gold-500" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 sm:py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Peperiksaan SPM
              </span>
            </div>

            <div className="flex items-baseline space-x-1.5">
              <span className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gov-navy-900 dark:text-white tracking-tight">
                5.12
              </span>
              <span className="text-xs font-semibold text-gov-gold-600 dark:text-gov-gold-400">
                GPD Daerah
              </span>
            </div>

            <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white mt-1 sm:mt-1.5 leading-snug group-hover:text-gov-gold-600 dark:group-hover:text-gov-gold-400 transition-colors">
              Gred Purata SPM
            </h4>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              Pencapaian Gred Purata Daerah (GPD) calon Sijil Pelajaran Malaysia daerah Beluran.
            </p>
          </div>

          <div className="mt-4 sm:mt-5 pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-gov-gold-600 dark:text-gov-gold-400">
            <span>Lihat Dokumen</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* KAD 3: PURATA LULUS MATA PELAJARAN */}
        <div
          onClick={handleOpenPurataLulus}
          className="min-w-[260px] max-w-[285px] sm:min-w-0 sm:max-w-none shrink-0 snap-center group relative bg-white dark:bg-gov-navy-900 rounded-2xl p-4 sm:p-6 lg:p-7 border border-slate-200/90 dark:border-slate-800 shadow-md sm:shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer flex flex-col justify-between"
        >
          {/* Top accent line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-gov-gold-500/20 via-gov-gold-500 to-gov-gold-500/20 opacity-70 group-hover:opacity-100 transition-opacity" />

          {/* Background subtle watermark */}
          <div className="absolute -right-3 -bottom-3 opacity-5 dark:opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
            <Award className="w-20 h-20 sm:w-28 sm:h-28 text-gov-gold-500" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gov-gold-500/10 dark:bg-gov-navy-950 border border-gov-gold-500/20 flex items-center justify-center">
                <Award className="w-5 h-5 sm:w-6 sm:h-6 text-gov-gold-500" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 sm:py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Penguasaan Subjek
              </span>
            </div>

            <div className="flex items-baseline space-x-1.5">
              <span className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gov-navy-900 dark:text-white tracking-tight">
                89.4%
              </span>
              <span className="text-xs font-semibold text-gov-gold-600 dark:text-gov-gold-400">
                Lulus
              </span>
            </div>

            <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white mt-1 sm:mt-1.5 leading-snug group-hover:text-gov-gold-600 dark:group-hover:text-gov-gold-400 transition-colors">
              Purata Lulus Mata Pelajaran Teras
            </h4>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              Kadar kelulusan &amp; penguasaan bagi mata pelajaran SPM seluruh daerah Beluran.
            </p>
          </div>

          <div className="mt-4 sm:mt-5 pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-gov-gold-600 dark:text-gov-gold-400">
            <span>Lihat Dokumen</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </section>
  );
};
