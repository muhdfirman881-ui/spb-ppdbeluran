'use client';

import React, { useState, useMemo } from 'react';
import { Unit, UnitCategory } from '@/types';
import {
  BookOpen,
  Globe,
  FlaskConical,
  Calculator,
  Landmark,
  RefreshCw,
  Moon,
  Accessibility,
  Tv,
  Folder,
  ArrowRight,
  FileText,
  ExternalLink,
  Layers,
  Search,
  X,
  Filter,
  Cpu,
} from 'lucide-react';

interface UnitsSectionProps {
  categories: UnitCategory[];
  units: Unit[];
  onSelectUnit: (unitId: string) => void;
}

export const UnitsSection: React.FC<UnitsSectionProps> = ({
  categories,
  units,
  onSelectUnit,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const getUnitIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case 'book-open':
      case 'book':
        return <BookOpen className="w-5 h-5 text-gov-gold-500" />;
      case 'globe':
        return <Globe className="w-5 h-5 text-gov-gold-500" />;
      case 'flask':
      case 'flask-conical':
        return <FlaskConical className="w-5 h-5 text-gov-gold-500" />;
      case 'calculator':
        return <Calculator className="w-5 h-5 text-gov-gold-500" />;
      case 'landmark':
        return <Landmark className="w-5 h-5 text-gov-gold-500" />;
      case 'refresh':
      case 'refresh-cw':
        return <RefreshCw className="w-5 h-5 text-gov-gold-500" />;
      case 'mosque':
      case 'moon':
        return <Moon className="w-5 h-5 text-gov-gold-500" />;
      case 'accessibility':
      case 'users':
        return <Accessibility className="w-5 h-5 text-gov-gold-500" />;
      case 'tv':
      case 'monitor':
        return <Tv className="w-5 h-5 text-gov-gold-500" />;
      case 'cpu':
      case 'tvet':
      case 'wrench':
        return <Cpu className="w-5 h-5 text-gov-gold-500" />;
      default:
        return <Folder className="w-5 h-5 text-gov-gold-500" />;
    }
  };

  // Filtered categories and units
  const filteredHierarchy = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return [...categories]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .filter((cat) => selectedCategory === 'all' || cat.categoryId === selectedCategory)
      .map((cat) => {
        const catUnits = units
          .filter((u) => {
            if (u.categoryId !== cat.categoryId) return false;
            if (!q) return true;
            return (
              u.unitName.toLowerCase().includes(q) ||
              u.tagline?.toLowerCase().includes(q) ||
              u.description?.toLowerCase().includes(q) ||
              u.unitCode?.toLowerCase().includes(q)
            );
          })
          .sort((a, b) => a.displayOrder - b.displayOrder);

        return {
          category: cat,
          units: catUnits,
        };
      })
      .filter((group) => group.units.length > 0);
  }, [categories, units, searchQuery, selectedCategory]);

  const totalFilteredUnits = filteredHierarchy.reduce((acc, curr) => acc + curr.units.length, 0);

  return (
    <section id="unit" className="py-16 sm:py-24 bg-white dark:bg-gov-navy-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 text-gov-gold-600 dark:text-gov-gold-400 font-bold text-xs uppercase tracking-wider mb-2">
            <Layers className="w-4 h-4" />
            <span>Struktur Instruksional Sektor</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-extrabold text-gov-navy-900 dark:text-white tracking-tight">
            Unit & Sektor Pembelajaran
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Terokai peranan, bimbingan pedagogi SISC+, maklumat tenaga kerja, serta repositori dokumen dan modul bagi setiap unit di bawah Sektor Pembelajaran PPD Beluran.
          </p>
        </div>

        {/* Premium Interactive Search & Filter Controls */}
        <div className="max-w-4xl mx-auto mb-14 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input Bar */}
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari unit (cth: Sains, TVET, Bahasa, Prasekolah, Pemulihan)..."
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-slate-50 dark:bg-gov-navy-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-gov-gold-500/50 focus:border-gov-gold-500 transition-all text-sm shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-gov-gold-500 text-gov-navy-950 shadow-sm'
                    : 'bg-slate-100 dark:bg-gov-navy-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-gov-navy-800'
                }`}
              >
                Semua Unit ({units.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.categoryId}
                  onClick={() => setSelectedCategory(cat.categoryId)}
                  className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedCategory === cat.categoryId
                      ? 'bg-gov-gold-500 text-gov-navy-950 shadow-sm'
                      : 'bg-slate-100 dark:bg-gov-navy-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-gov-navy-800'
                  }`}
                >
                  {cat.categoryName}
                </button>
              ))}
            </div>
          </div>

          {/* Result Counter Indicator */}
          {searchQuery && (
            <div className="text-xs text-slate-500 dark:text-slate-400 px-1 flex items-center justify-between">
              <span>
                Menunjukkan <strong className="text-gov-gold-600 dark:text-gov-gold-400">{totalFilteredUnits}</strong> unit untuk padanan &quot;{searchQuery}&quot;
              </span>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="text-gov-gold-600 dark:text-gov-gold-400 hover:underline"
              >
                Set Semula Carian
              </button>
            </div>
          )}
        </div>

        {/* Empty State */}
        {filteredHierarchy.length === 0 && (
          <div className="text-center py-16 bg-slate-50 dark:bg-gov-navy-900/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 max-w-xl mx-auto">
            <Layers className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              Tiada Unit Ditemui
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Tiada unit yang sepadan dengan kriteria carian anda. Sila cuba kata kunci lain.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-gov-gold-500 text-gov-navy-950 text-xs font-bold shadow-sm hover:bg-gov-gold-600 transition-colors"
            >
              Papar Semua Unit
            </button>
          </div>
        )}

        {/* Categories Grouped Display */}
        <div className="space-y-16">
          {filteredHierarchy.map(({ category: cat, units: catUnits }) => (
            <div key={cat.categoryId} className="space-y-6">
              {/* Category Header */}
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div>
                  <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gov-navy-900 dark:text-white tracking-tight leading-tight">
                    {cat.categoryName}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                    {cat.description}
                  </p>
                </div>
                <span className="text-xs sm:text-sm font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 mt-2 sm:mt-0 w-fit shrink-0 border border-slate-200 dark:border-slate-700">
                  {catUnits.length} Unit
                </span>
              </div>

              {/* Units Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {catUnits.map((u) => {
                  const isExternal = Boolean(u.externalLink);
                  return (
                    <div
                      key={u.unitId}
                      onClick={() => onSelectUnit(u.unitId)}
                      className="card-spotlight group bg-slate-50/80 dark:bg-gov-navy-900/60 hover:bg-white dark:hover:bg-gov-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-gov-gold-500/60 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 rounded-xl bg-gov-gold-500/10 border border-gov-gold-500/20 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                            {getUnitIcon(u.icon)}
                          </div>
                          <div className="flex items-center space-x-1.5">
                            {u.hasDocuments && (
                              <span
                                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[11px] font-semibold border border-blue-200 dark:border-blue-800"
                                title="Mempunyai repositori dokumen & modul"
                              >
                                <FileText className="w-3 h-3" />
                                <span>Dokumen</span>
                              </span>
                            )}
                            {isExternal && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (u.externalLink) window.open(u.externalLink, '_blank', 'noopener,noreferrer');
                                }}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[11px] font-semibold border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors"
                                title="Buka pautan portal luar rasmi"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Pautan Luar</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <h4 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-gov-gold-600 dark:group-hover:text-gov-gold-400 transition-colors leading-snug">
                          {u.unitName}
                        </h4>

                        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                          {u.tagline || u.description}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs font-semibold text-gov-gold-600 dark:text-gov-gold-400">
                        <span>{isExternal ? 'Akses Portal Luar' : 'Lihat Profil & Repositori'}</span>
                        {isExternal ? (
                          <ExternalLink className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform" />
                        ) : (
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
