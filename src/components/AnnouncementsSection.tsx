'use client';

import React, { useState, useMemo } from 'react';
import { Announcement } from '@/types';
import {
  Calendar,
  Tag,
  ArrowRight,
  ExternalLink,
  X,
  Bell,
  Share2,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { getOptimizedImageUrl } from '@/lib/config';

interface AnnouncementsSectionProps {
  announcements: Announcement[];
}

export const AnnouncementsSection: React.FC<AnnouncementsSectionProps> = ({ announcements }) => {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    announcements.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    return Array.from(set);
  }, [announcements]);

  const filteredAnnouncements = useMemo(() => {
    if (activeCategory === 'all') return announcements;
    return announcements.filter(
      (a) => a.category?.toLowerCase() === activeCategory.toLowerCase()
    );
  }, [announcements, activeCategory]);

  const displayedAnnouncements = useMemo(() => {
    if (showAll) return filteredAnnouncements;
    return filteredAnnouncements.slice(0, 6);
  }, [filteredAnnouncements, showAll]);

  const handleCopyShareLink = (announcement: Announcement) => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/#hebahan` : '';
    navigator.clipboard.writeText(`${announcement.title} - ${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (announcements.length === 0) return null;

  return (
    <section id="hebahan" className="py-8 sm:py-16 lg:py-20 bg-slate-50 dark:bg-gov-navy-900/40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header & Category Filters */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-10 gap-4 sm:gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 text-gov-gold-600 dark:text-gov-gold-400 font-bold text-xs uppercase tracking-wider mb-1.5 sm:mb-2">
              <Bell className="w-4 h-4" />
              <span>Hebahan & Notis Terkini</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-gov-navy-900 dark:text-white tracking-tight">
              Hebahan Rasmi Sektor
            </h2>
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Maklumat pekeliling, program kurikulum, bimbingan pedagogi dan pengumuman rasmi Sektor Pembelajaran PPD Beluran.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => {
                setActiveCategory('all');
                setShowAll(false);
              }}
              className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-gov-gold-500 text-gov-navy-950 shadow-sm'
                  : 'bg-white dark:bg-gov-navy-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gov-navy-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              Semua ({announcements.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setShowAll(false);
                }}
                className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-gov-gold-500 text-gov-navy-950 shadow-sm'
                    : 'bg-white dark:bg-gov-navy-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gov-navy-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Announcements Strip on Mobile (Horizontal Snap Carousel) / Responsive Grid on Tablet & Desktop */}
        <div
          className={
            showAll
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8'
              : 'flex sm:grid sm:grid-cols-2 lg:grid-cols-3 overflow-x-auto sm:overflow-visible snap-x snap-mandatory gap-4 sm:gap-6 lg:gap-8 pb-3 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none'
          }
        >
          {displayedAnnouncements.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedAnnouncement(item)}
              className={`${
                showAll ? '' : 'min-w-[82vw] max-w-[320px] sm:min-w-0 sm:max-w-none shrink-0 snap-center'
              } card-spotlight group bg-white dark:bg-gov-navy-950 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer hover:border-gov-gold-500/50`}
            >
              {item.imageUrl && (
                <div className="relative h-36 sm:h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                  <img
                    src={getOptimizedImageUrl(item.imageUrl)}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!target.dataset.triedDirect && item.imageUrl && item.imageUrl.includes('lh3.googleusercontent.com')) {
                        target.dataset.triedDirect = 'true';
                        target.src = item.imageUrl;
                      } else {
                        target.style.display = 'none';
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                </div>
              )}

              <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2.5 sm:space-x-3 text-xs mb-2.5 sm:mb-3">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 sm:py-1 rounded-full bg-gov-gold-500/10 text-gov-gold-600 dark:text-gov-gold-400 font-semibold border border-gov-gold-500/20">
                      <Tag className="w-3 h-3" />
                      <span>{item.category || 'Hebahan'}</span>
                    </span>
                    <span className="text-slate-400 flex items-center space-x-1 text-[11px] sm:text-xs">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{item.date}</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-gov-gold-600 dark:group-hover:text-gov-gold-400 transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </h3>

                  <p className="mt-1.5 sm:mt-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                    {item.summary}
                  </p>
                </div>

                <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-gov-gold-600 dark:text-gov-gold-400">
                  <span>Baca Lanjut & Maklumat</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Swipe Hint & Expand/Collapse Button */}
        {filteredAnnouncements.length > 1 && (
          <div className="mt-4 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            {!showAll && (
              <p className="sm:hidden text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                &larr; Geser ke kiri/kanan untuk melihat {filteredAnnouncements.length} hebahan &rarr;
              </p>
            )}
            <div className={`${filteredAnnouncements.length > 6 ? 'flex' : 'flex sm:hidden'} mx-auto`}>
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white dark:bg-gov-navy-900 border border-slate-200 dark:border-slate-800 hover:border-gov-gold-500 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-xs transition-all"
              >
                <span>
                  {showAll
                    ? 'Ringkaskan Paparan Hebahan'
                    : `Papar Semua Hebahan (${filteredAnnouncements.length})`}
                </span>
                {showAll ? <ChevronUp className="w-4 h-4 text-gov-gold-500" /> : <ChevronDown className="w-4 h-4 text-gov-gold-500" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal with Sharing & Backdrop */}
      {selectedAnnouncement && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedAnnouncement(null)}
        >
          <div
            className="bg-white dark:bg-gov-navy-950 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedAnnouncement.imageUrl && (
              <div className="relative h-64 sm:h-72 w-full bg-slate-100 dark:bg-slate-900 flex-shrink-0">
                <img
                  src={getOptimizedImageUrl(selectedAnnouncement.imageUrl)}
                  alt={selectedAnnouncement.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              </div>
            )}

            <div className="p-6 sm:p-8 overflow-y-auto flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3 text-xs">
                  <span className="px-3 py-1 rounded-full bg-gov-gold-500/10 text-gov-gold-600 dark:text-gov-gold-400 font-bold border border-gov-gold-500/20">
                    {selectedAnnouncement.category}
                  </span>
                  <span className="text-slate-400 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{selectedAnnouncement.date}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCopyShareLink(selectedAnnouncement)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Kongsi hebahan ini"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedAnnouncement(null)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Tutup"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {copied && (
                <div className="mb-4 py-1.5 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                  Pautan hebahan telah disalin ke papan keratan!
                </div>
              )}

              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-4 leading-tight">
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
                    <span>Buka Pautan Hebahan Rasmi</span>
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
