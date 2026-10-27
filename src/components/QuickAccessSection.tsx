'use client';

import React from 'react';
import { QuickAccessService, DocumentRecord } from '@/types';
import {
  Network,
  Laptop,
  Users,
  Globe,
  FileText,
  ExternalLink,
  ChevronRight,
  Bookmark,
  Eye,
} from 'lucide-react';

interface QuickAccessSectionProps {
  services: QuickAccessService[];
  onSelectSisc?: () => void;
  onPreviewDocument?: (doc: DocumentRecord) => void;
}

function extractDriveFileId(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];
  const matchParam = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchParam && matchParam[1]) return matchParam[1];
  return null;
}

export const QuickAccessSection: React.FC<QuickAccessSectionProps> = ({
  services,
  onSelectSisc,
  onPreviewDocument,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case 'sitemap':
        return <Network className="w-6 h-6 text-gov-gold-500" />;
      case 'laptop':
        return <Laptop className="w-6 h-6 text-gov-gold-500" />;
      case 'users':
        return <Users className="w-6 h-6 text-gov-gold-500" />;
      case 'file-text':
      case 'file':
      case 'document':
        return <FileText className="w-6 h-6 text-gov-gold-500" />;
      case 'globe':
      default:
        return <Globe className="w-6 h-6 text-gov-gold-500" />;
    }
  };

  return (
    <section className="py-14 sm:py-16 bg-white dark:bg-gov-navy-950 border-b border-slate-200 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-2 text-xs font-bold text-gov-gold-600 dark:text-gov-gold-400 uppercase tracking-wider mb-8">
          <Bookmark className="w-4 h-4 text-gov-gold-500" />
          <span>Pautan Pantas & Perkhidmatan Digital Sektor</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 sm:gap-6">
          {services.map((item, idx) => {
            const isSiscInternal = item.link === '#unit';
            const driveFileId = extractDriveFileId(item.link);
            const isDocumentPreview = Boolean(driveFileId && onPreviewDocument);

            // Case 1: Internal SISC Section Jump
            if (isSiscInternal) {
              return (
                <div
                  key={idx}
                  onClick={onSelectSisc}
                  className="card-spotlight group relative bg-slate-50 dark:bg-gov-navy-900/60 hover:bg-white dark:hover:bg-gov-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-gov-gold-500/60 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-gov-gold-500/10 border border-gov-gold-500/20 flex items-center justify-center shadow-xs mb-5 group-hover:scale-110 transition-transform">
                      {getIcon(item.icon)}
                    </div>
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-gov-gold-600 dark:group-hover:text-gov-gold-400 transition-colors leading-snug">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <div className="mt-6 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center text-xs font-bold text-gov-gold-600 dark:text-gov-gold-400">
                    <span>Lihat Maklumat Bimbingan</span>
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </div>
              );
            }

            // Case 2: Document In-App Preview (Carta Organisasi & DATA IPPK / SPM)
            if (isDocumentPreview && driveFileId && onPreviewDocument) {
              return (
                <div
                  key={idx}
                  onClick={() => {
                    const isCarta = item.title.toLowerCase().includes('carta');
                    onPreviewDocument({
                      documentId: driveFileId,
                      unitId: 'quick-access',
                      title: item.title,
                      category: isCarta ? 'Carta Organisasi' : 'Laporan & Analisis',
                      description: item.description,
                      fileId: driveFileId,
                      fileName: `${item.title}.pdf`,
                      fileType: 'pdf',
                      fileSize: 'PDF',
                      displayOrder: idx + 1,
                      status: 'active',
                      uploadedAt: new Date().toISOString(),
                      viewUrl: item.link,
                    });
                  }}
                  className="card-spotlight group relative bg-slate-50 dark:bg-gov-navy-900/60 hover:bg-white dark:hover:bg-gov-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-gov-gold-500/60 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-gov-gold-500/10 border border-gov-gold-500/20 flex items-center justify-center shadow-xs mb-5 group-hover:scale-110 transition-transform">
                      {getIcon(item.icon)}
                    </div>
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-gov-gold-600 dark:group-hover:text-gov-gold-400 transition-colors flex items-center justify-between leading-snug">
                      <span>{item.title}</span>
                      <Eye className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity text-gov-gold-500" />
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <div className="mt-6 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center text-xs font-bold text-gov-gold-600 dark:text-gov-gold-400">
                    <span>Pratonton Dokumen</span>
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </div>
              );
            }

            // Case 3: External URL Link
            return (
              <a
                key={idx}
                href={item.link}
                target={item.external ? '_blank' : '_self'}
                rel="noopener noreferrer"
                className="card-spotlight group relative bg-slate-50 dark:bg-gov-navy-900/60 hover:bg-white dark:hover:bg-gov-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-gov-gold-500/60 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-gov-gold-500/10 border border-gov-gold-500/20 flex items-center justify-center shadow-xs mb-5 group-hover:scale-110 transition-transform">
                    {getIcon(item.icon)}
                  </div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-gov-gold-600 dark:group-hover:text-gov-gold-400 transition-colors flex items-center justify-between leading-snug">
                    <span>{item.title}</span>
                    {item.external && <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center text-xs font-bold text-gov-gold-600 dark:text-gov-gold-400">
                  <span>Akses Sistem Digital</span>
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};
