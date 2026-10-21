'use client';

import React from 'react';
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
      default:
        return <Folder className="w-5 h-5 text-gov-gold-500" />;
    }
  };

  return (
    <section id="unit" className="py-16 sm:py-24 bg-white dark:bg-gov-navy-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 text-gov-gold-600 dark:text-gov-gold-400 font-semibold text-xs uppercase tracking-wider mb-2">
            <Layers className="w-4 h-4" />
            <span>Struktur Instruksional Sektor</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-gov-navy-900 dark:text-white tracking-tight">
            Unit & Sektor Pembelajaran
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Terokai peranan, bimbingan pedagogi, direktori pegawai, serta repositori dokumen dan modul bagi setiap unit di bawah Sektor Pembelajaran PPD Beluran.
          </p>
        </div>

        {/* Categories Grouped Display */}
        <div className="space-y-16">
          {categories.map((cat) => {
            const catUnits = units.filter((u) => u.categoryId === cat.categoryId);
            if (catUnits.length === 0) return null;

            return (
              <div key={cat.categoryId} className="space-y-6">
                {/* Category Header */}
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-baseline justify-between">
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-gov-navy-900 dark:text-white tracking-tight">
                      {cat.categoryName}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {cat.description}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 mt-2 sm:mt-0 w-fit">
                    {catUnits.length} Unit
                  </span>
                </div>

                {/* Units Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {catUnits.map((u) => (
                    <div
                      key={u.unitId}
                      onClick={() => onSelectUnit(u.unitId)}
                      className="group bg-slate-50 dark:bg-gov-navy-900/50 hover:bg-white dark:hover:bg-gov-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-gov-gold-500/50 shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 rounded-xl bg-white dark:bg-gov-navy-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                            {getUnitIcon(u.icon)}
                          </div>
                          <div className="flex items-center space-x-1.5">
                            {u.hasDocuments && (
                              <span
                                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-medium border border-blue-200 dark:border-blue-800"
                                title="Mempunyai repositori dokumen"
                              >
                                <FileText className="w-3 h-3" />
                                <span>Dokumen</span>
                              </span>
                            )}
                            {u.externalLink && (
                              <span
                                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-medium border border-amber-200 dark:border-amber-800"
                                title="Pautan portal luar"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Pautan</span>
                              </span>
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
                        <span>Lihat Profil & Repositori</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
