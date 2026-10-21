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
  CheckCircle2,
  Briefcase,
  Mail,
  Phone,
  ExternalLink,
  FolderOpen,
} from 'lucide-react';

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
  const { unit, responsibilities, services, customContent, employees, documents } = unitData;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocCategory, setSelectedDocCategory] = useState('Semua');

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
    <div className="py-8 sm:py-12 bg-slate-50 dark:bg-gov-navy-950 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-white dark:bg-gov-navy-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-gov-gold-600 dark:hover:text-gov-gold-400 hover:border-gov-gold-500/50 shadow-xs transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Senarai Unit</span>
          </button>

          {unit.externalLink && (
            <a
              href={unit.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-gov-gold-500 hover:bg-gov-gold-600 text-gov-navy-950 text-xs sm:text-sm font-bold shadow-xs transition-all"
            >
              <span>Portal Luaran Unit</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Unit Hero Banner */}
        <div className="bg-white dark:bg-gov-navy-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-sm relative overflow-hidden">
          <div className="relative z-10 max-w-4xl">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-gov-gold-500/15 text-gov-gold-600 dark:text-gov-gold-400 mb-3">
              {unit.unitCode} &bull; Sektor Pembelajaran
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-gov-navy-900 dark:text-white tracking-tight leading-tight">
              {unit.title || unit.unitName}
            </h1>
            <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              {unit.tagline}
            </p>
            {unit.description && unit.description !== unit.tagline && (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
                {unit.description}
              </p>
            )}
          </div>
        </div>

        {/* Roles & Services Dual Columns */}
        {(responsibilities.length > 0 || services.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Responsibilities */}
            {responsibilities.length > 0 && (
              <div className="bg-white dark:bg-gov-navy-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
                <div className="flex items-center space-x-2.5 text-gov-navy-900 dark:text-white font-bold text-lg mb-6">
                  <CheckCircle2 className="w-5 h-5 text-gov-gold-500" />
                  <span>Fungsi & Peranan Utama</span>
                </div>
                <ul className="space-y-3.5">
                  {responsibilities.map((resp, idx) => (
                    <li key={idx} className="flex items-start space-x-3 text-sm text-slate-700 dark:text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-gov-gold-500 mt-2 flex-shrink-0"></span>
                      <span className="leading-relaxed">{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Services */}
            {services.length > 0 && (
              <div className="bg-white dark:bg-gov-navy-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
                <div className="flex items-center space-x-2.5 text-gov-navy-900 dark:text-white font-bold text-lg mb-6">
                  <Briefcase className="w-5 h-5 text-gov-gold-500" />
                  <span>Perkhidmatan & Khidmat Bimbingan</span>
                </div>
                <ul className="space-y-3.5">
                  {services.map((serv, idx) => (
                    <li key={idx} className="flex items-start space-x-3 text-sm text-slate-700 dark:text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-gov-gold-500 mt-2 flex-shrink-0"></span>
                      <span className="leading-relaxed">{serv}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Officers Directory */}
        {employees.length > 0 && (
          <div className="bg-white dark:bg-gov-navy-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center space-x-2.5 text-gov-navy-900 dark:text-white font-bold text-lg mb-6">
              <Users className="w-5 h-5 text-gov-gold-500" />
              <span>Pegawai & Anggota Unit</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {employees.map((emp) => (
                <div
                  key={emp.employeeId}
                  className="bg-slate-50 dark:bg-gov-navy-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start space-x-4"
                >
                  <div className="w-14 h-14 rounded-full bg-gov-gold-500/20 text-gov-gold-600 dark:text-gov-gold-400 flex items-center justify-center font-bold text-lg flex-shrink-0 border border-gov-gold-500/30 overflow-hidden">
                    {emp.photoFileId ? (
                      <img
                        src={`https://lh3.googleusercontent.com/d/${emp.photoFileId}`}
                        alt={emp.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      emp.name.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {emp.name}
                    </h4>
                    <p className="text-xs text-gov-gold-600 dark:text-gov-gold-400 font-medium mt-0.5">
                      {emp.position}
                    </p>
                    {emp.email && (
                      <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2 truncate">
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{emp.email}</span>
                      </div>
                    )}
                    {emp.phone && (
                      <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{emp.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Document Repository */}
        {unit.hasDocuments && (
          <div className="bg-white dark:bg-gov-navy-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-2.5 text-gov-navy-900 dark:text-white font-bold text-lg">
                <FolderOpen className="w-5 h-5 text-gov-gold-500" />
                <span>Repositori Dokumen & Modul</span>
              </div>

              {/* Search Bar */}
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
                        ? 'bg-gov-gold-500 text-gov-navy-950'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Documents List */}
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">Tiada dokumen ditemui untuk carian atau kategori ini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc.documentId}
                    className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-gov-navy-950/60 hover:bg-white dark:hover:bg-gov-navy-950 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-gov-gold-500/10 text-gov-gold-600 dark:text-gov-gold-400 font-semibold text-xs">
                          {doc.category || 'Dokumen'}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">{doc.fileSize}</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug line-clamp-2">
                        {doc.title}
                      </h4>
                      {doc.description && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {doc.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onPreviewDocument(doc)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-gov-gold-500 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-gov-gold-600 dark:hover:text-gov-gold-400 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Pratonton</span>
                      </button>

                      {doc.downloadUrl && (
                        <a
                          href={doc.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gov-gold-500 hover:bg-gov-gold-600 text-gov-navy-950 text-xs font-bold transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Muat Turun</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
