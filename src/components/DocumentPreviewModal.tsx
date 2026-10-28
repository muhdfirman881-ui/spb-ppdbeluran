'use client';

import React, { useState, useEffect } from 'react';
import { DocumentRecord } from '@/types';
import {
  X,
  ExternalLink,
  Download,
  FileText,
  Loader2,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  AlertCircle,
  Maximize2,
} from 'lucide-react';

interface DocumentPreviewModalProps {
  document: DocumentRecord | null;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [useDriveFallback, setUseDriveFallback] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setUseDriveFallback(false);
  }, [document?.fileId]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!document) return null;

  const streamUrl = `/api/files/${document.fileId}?inline=true`;
  const downloadUrl = `/api/files/${document.fileId}?download=true`;
  const driveViewUrl = `https://drive.google.com/file/d/${document.fileId}/view`;
  const drivePreviewUrl = `https://drive.google.com/file/d/${document.fileId}/preview`;

  const activeIframeSrc = useDriveFallback ? drivePreviewUrl : streamUrl;

  const getFileIcon = () => {
    const type = (document.fileType || '').toLowerCase();
    const name = (document.fileName || '').toLowerCase();
    if (type.includes('pdf') || name.endsWith('.pdf')) {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    if (type.includes('image') || /\.(jpg|jpeg|png|webp)$/i.test(name)) {
      return <ImageIcon className="w-5 h-5 text-emerald-500" />;
    }
    if (type.includes('ppt') || /\.(ppt|pptx)$/i.test(name)) {
      return <FileSpreadsheet className="w-5 h-5 text-amber-500" />;
    }
    return <FileCode className="w-5 h-5 text-gov-gold-500" />;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gov-navy-950 rounded-2xl w-full max-w-6xl h-[92vh] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-gov-navy-900 flex-shrink-0">
          <div className="flex items-center space-x-3 min-w-0 pr-3">
            <div className="p-2 rounded-xl bg-white dark:bg-gov-navy-950 border border-slate-200 dark:border-slate-800 shadow-xs flex-shrink-0">
              {getFileIcon()}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                {document.title}
              </h3>
              <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="truncate max-w-[200px] sm:max-w-md">{document.fileName}</span>
                <span>&bull;</span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {document.fileSize || 'PDF'}
                </span>
                {document.category && (
                  <>
                    <span>&bull;</span>
                    <span className="px-2 py-0.5 rounded-full bg-gov-gold-500/15 text-gov-gold-600 dark:text-gov-gold-400 text-[10px] font-bold">
                      {document.category}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
            {/* View Mode Toggle: Direct vs Drive */}
            <button
              onClick={() => {
                setIsLoading(true);
                setUseDriveFallback(!useDriveFallback);
              }}
              className="hidden md:inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
              title="Tukar antara mod paparan terus atau Google Drive"
            >
              <span>{useDriveFallback ? 'Mod Terus (PDF)' : 'Mod Google Drive'}</span>
            </button>

            {/* Direct Download Button */}
            <a
              href={downloadUrl}
              download={document.fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gov-gold-500 hover:bg-gov-gold-600 text-gov-navy-950 font-bold text-xs shadow-xs transition-colors"
              title="Muat Turun Fail ke Komputer/Peranti Anda"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Muat Turun</span>
            </a>

            {/* Open Full Tab Button */}
            <a
              href={streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Buka tab baharu skrin penuh"
            >
              <Maximize2 className="w-4 h-4" />
            </a>

            {/* External Google Drive Link */}
            <a
              href={driveViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Buka fail di Google Drive rasmi"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Iframe Viewport with Loading State */}
        <div className="flex-1 bg-slate-900 relative overflow-hidden flex flex-col">
          {isLoading && (
            <div className="absolute inset-0 z-10 bg-slate-900/90 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-gov-gold-500" />
              <p className="text-xs sm:text-sm font-semibold text-slate-300">
                Memuatkan paparan dokumen PDF...
              </p>
            </div>
          )}

          <iframe
            key={activeIframeSrc}
            src={activeIframeSrc}
            title={document.title}
            className="w-full flex-1 border-none bg-slate-900"
            allow="autoplay"
            onLoad={() => setIsLoading(false)}
          />

          {/* Bottom Fallback Bar */}
          <div className="px-3 sm:px-4 py-2 bg-slate-100 dark:bg-gov-navy-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-4 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
            <div className="flex items-center space-x-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-gov-gold-500 flex-shrink-0" />
              <span>
                Dokumen tidak terpapar dengan sempurna pada peranti anda?
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <a
                href={streamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gov-gold-600 dark:text-gov-gold-400 font-bold hover:underline"
              >
                Buka Tab Penuh
              </a>
              <span>&bull;</span>
              <a
                href={downloadUrl}
                download={document.fileName}
                className="text-gov-gold-600 dark:text-gov-gold-400 font-bold hover:underline"
              >
                Muat Turun Fail
              </a>
              <span>&bull;</span>
              <a
                href={driveViewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gov-gold-600 dark:text-gov-gold-400 font-bold hover:underline"
              >
                Google Drive
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
