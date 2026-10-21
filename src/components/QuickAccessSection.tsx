'use client';

import React from 'react';
import { QuickAccessService } from '@/types';
import {
  Network,
  Laptop,
  Users,
  Globe,
  ExternalLink,
  ChevronRight,
  Bookmark,
} from 'lucide-react';

interface QuickAccessSectionProps {
  services: QuickAccessService[];
  onSelectSisc?: () => void;
}

export const QuickAccessSection: React.FC<QuickAccessSectionProps> = ({
  services,
  onSelectSisc,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case 'sitemap':
        return <Network className="w-6 h-6 text-gov-gold-500" />;
      case 'laptop':
        return <Laptop className="w-6 h-6 text-gov-gold-500" />;
      case 'users':
        return <Users className="w-6 h-6 text-gov-gold-500" />;
      case 'globe':
      default:
        return <Globe className="w-6 h-6 text-gov-gold-500" />;
    }
  };

  return (
    <section className="py-12 bg-white dark:bg-gov-navy-950 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-6">
          <Bookmark className="w-4 h-4 text-gov-gold-500" />
          <span>Pautan Pantas & Perkhidmatan Digital</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map((item, idx) => {
            const isSiscInternal = item.link === '#unit';

            if (isSiscInternal) {
              return (
                <div
                  key={idx}
                  onClick={onSelectSisc}
                  className="group relative bg-slate-50 dark:bg-gov-navy-900/60 hover:bg-gov-gold-50/50 dark:hover:bg-gov-navy-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-gov-gold-500/50 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-gov-navy-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-xs mb-4 group-hover:scale-105 transition-transform">
                      {getIcon(item.icon)}
                    </div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-gov-gold-600 dark:group-hover:text-gov-gold-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center text-xs font-semibold text-gov-gold-600 dark:text-gov-gold-400">
                    <span>Lihat Maklumat</span>
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            }

            return (
              <a
                key={idx}
                href={item.link}
                target={item.external ? '_blank' : '_self'}
                rel="noopener noreferrer"
                className="group relative bg-slate-50 dark:bg-gov-navy-900/60 hover:bg-gov-gold-50/50 dark:hover:bg-gov-navy-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-gov-gold-500/50 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-gov-navy-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-xs mb-4 group-hover:scale-105 transition-transform">
                    {getIcon(item.icon)}
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-gov-gold-600 dark:group-hover:text-gov-gold-400 transition-colors flex items-center justify-between">
                    <span>{item.title}</span>
                    {item.external && <ExternalLink className="w-3.5 h-3.5 opacity-50" />}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs font-semibold text-gov-gold-600 dark:text-gov-gold-400">
                  <span>Akses Sistem</span>
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};
