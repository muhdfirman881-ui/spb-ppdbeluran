'use client';

import React, { useState } from 'react';
import { Announcement } from '@/types';
import { Calendar, Tag, ArrowRight, ExternalLink, X, Bell } from 'lucide-react';

interface AnnouncementsSectionProps {
  announcements: Announcement[];
}

export const AnnouncementsSection: React.FC<AnnouncementsSectionProps> = ({ announcements }) => {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  if (announcements.length === 0) return null;

  return (
    <section id="hebahan" className="py-14 sm:py-20 bg-slate-50 dark:bg-gov-navy-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <div className="inline-flex items-center space-x-2 text-gov-gold-600 dark:text-gov-gold-400 font-semibold text-xs uppercase tracking-wider mb-2">
              <Bell className="w-4 h-4" />
              <span>Hebahan & Notis Terkini</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gov-navy-900 dark:text-white tracking-tight">
              Hebahan Rasmi Sektor
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl">
              Maklumat pekeliling, program kurikulum, bimbingan pedagogi dan pengumuman rasmi Sektor Pembelajaran PPD Beluran.
            </p>
          </div>
        </div>

        {/* Announcements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {announcements.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedAnnouncement(item)}
              className="group bg-white dark:bg-gov-navy-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden cursor-pointer hover:border-gov-gold-500/50"
            >
              {item.imageUrl && (
                <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-3 text-xs mb-3">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-gov-gold-500/10 text-gov-gold-600 dark:text-gov-gold-400 font-semibold">
                      <Tag className="w-3 h-3" />
                      <span>{item.category || 'Hebahan'}</span>
                    </span>
                    <span className="text-slate-400 flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{item.date}</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-gov-gold-600 dark:group-hover:text-gov-gold-400 transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </h3>

                  <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {item.summary}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-gov-gold-600 dark:text-gov-gold-400">
                  <span>Baca Lanjut</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedAnnouncement && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedAnnouncement(null)}
        >
          <div
            className="bg-white dark:bg-gov-navy-950 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedAnnouncement.imageUrl && (
              <div className="relative h-64 w-full bg-slate-100 dark:bg-slate-900 flex-shrink-0">
                <img
                  src={selectedAnnouncement.imageUrl}
                  alt={selectedAnnouncement.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-6 sm:p-8 overflow-y-auto flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3 text-xs">
                  <span className="px-3 py-1 rounded-full bg-gov-gold-500/10 text-gov-gold-600 dark:text-gov-gold-400 font-semibold">
                    {selectedAnnouncement.category}
                  </span>
                  <span className="text-slate-400 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{selectedAnnouncement.date}</span>
                  </span>
                </div>
                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">
                {selectedAnnouncement.title}
              </h2>

              <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {selectedAnnouncement.summary}
              </div>

              {selectedAnnouncement.link && (
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <a
                    href={selectedAnnouncement.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gov-gold-500 hover:bg-gov-gold-600 text-gov-navy-950 font-bold text-sm transition-all shadow-sm"
                  >
                    <span>Buka Pautan Hebahan</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
