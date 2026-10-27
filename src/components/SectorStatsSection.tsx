'use client';

import React from 'react';
import { School, Layers, FileCheck, Award, TrendingUp, Users } from 'lucide-react';

export const SectorStatsSection: React.FC = () => {
  const stats = [
    {
      value: '47',
      unit: 'Buah',
      label: 'Sekolah Rendah & Menengah',
      desc: 'Institusi pendidikan seluruh daerah Beluran',
      icon: <School className="w-6 h-6 text-gov-gold-500" />,
      highlight: 'SK, SMK, SJKC & SABK',
    },
    {
      value: '12',
      unit: 'Unit & Bidang',
      label: 'Unit Sektor & Pasukan SISC+',
      desc: 'Bimbingan pedagogi & sokongan pembelajaran',
      icon: <Layers className="w-6 h-6 text-gov-gold-500" />,
      highlight: 'Khidmat Bimbingan Berterusan',
    },
    {
      value: '100+',
      unit: 'Bahan',
      label: 'Repositori Modul & Dokumen',
      desc: 'RPH, DSKP, Modul Intervensi & Panduan PdP',
      icon: <FileCheck className="w-6 h-6 text-gov-gold-500" />,
      highlight: 'Akses Muat Turun Segera',
    },
    {
      value: '100%',
      unit: 'Digital',
      label: 'Penyelarasan Awan Google Drive',
      desc: 'Data segerak & pengurusan instruksional tanpa kertas',
      icon: <TrendingUp className="w-6 h-6 text-gov-gold-500" />,
      highlight: 'Kitaran Maklumat Pantas',
    },
  ];

  return (
    <section className="relative z-20 py-8 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((item, idx) => (
          <div
            key={idx}
            className="group relative bg-white dark:bg-gov-navy-900 rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
          >
            {/* Top accent line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-gov-gold-500/20 via-gov-gold-500 to-gov-gold-500/20 opacity-70 group-hover:opacity-100 transition-opacity" />

            {/* Background subtle watermark */}
            <div className="absolute -right-3 -bottom-3 opacity-5 dark:opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
              {React.cloneElement(item.icon, { className: 'w-24 h-24' })}
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-gov-gold-500/10 dark:bg-gov-navy-950 border border-gov-gold-500/20 flex items-center justify-center">
                {item.icon}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {item.highlight}
              </span>
            </div>

            <div className="flex items-baseline space-x-1.5">
              <span className="font-serif text-3xl sm:text-4xl font-extrabold text-gov-navy-900 dark:text-white tracking-tight">
                {item.value}
              </span>
              <span className="text-xs font-semibold text-gov-gold-600 dark:text-gov-gold-400">
                {item.unit}
              </span>
            </div>

            <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1.5 leading-snug">
              {item.label}
            </h4>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
