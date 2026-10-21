'use client';

import React from 'react';
import { DocumentRecord } from '@/types';
import { X, ExternalLink, Download, FileText } from 'lucide-react';

interface DocumentPreviewModalProps {
  document: DocumentRecord | null;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document,
  onClose,
}) => {
  if (!document) return null;

  const previewUrl =
    document.viewUrl || `https://drive.google.com/file/d/${document.fileId}/preview`;
  const downloadUrl =
    document.downloadUrl || `https://drive.google.com/uc?export=download&id=${document.fileId}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gov-navy-950 rounded-2xl w-full max-w-5xl h-[88vh] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-gov-navy-900 flex-shrink-0">
          <div className="flex items-center space-x-3 min-w-0 pr-4">
            <div className="p-2 rounded-lg bg-gov-gold-500/10 text-gov-gold-600 dark:text-gov-gold-400">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                {document.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {document.fileName} &bull; {document.fileSize}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gov-gold-500 hover:bg-gov-gold-600 text-gov-navy-950 font-bold text-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Muat Turun</span>
            </a>

            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Buka di tab baharu"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Iframe Viewport */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-900 relative">
          <iframe
            src={previewUrl}
            title={document.title}
            className="w-full h-full border-none"
            allow="autoplay"
          />
        </div>
      </div>
    </div>
  );
};
