'use client';

import React from 'react';
import { Announcement } from '@/types';
import { Bell, ChevronRight, Sparkles } from 'lucide-react';

interface NewsTickerProps {
  announcements: Announcement[];
  onSelectAnnouncement: (announcement: Announcement) => void;
}

export const NewsTicker: React.FC<NewsTickerProps> = ({
  announcements,
  onSelectAnnouncement,
}) => {
  if (!announcements || announcements.length === 0) return null;

  // Duplicate list slightly to allow continuous seamless looping
  const tickerItems = [...announcements, ...announcements];

  return (
    <div className="bg-gov-navy-950 border-y border-gov-navy-800 text-xs py-2 px-4 overflow-hidden relative select-none">
      <div className="max-w-7xl mx-auto flex items-center">
        {/* Left Badge */}
        <div className="flex-shrink-0 flex items-center space-x-1.5 px-3 py-1 rounded-md bg-gov-gold-500 text-gov-navy-950 font-bold text-[11px] tracking-wide uppercase mr-4 shadow-sm z-10">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping inline-block mr-0.5" />
          <Bell className="w-3 h-3 text-gov-navy-950" />
          <span>Hebahan</span>
        </div>

        {/* Ticker Container with Left & Right Gradient Mask */}
        <div className="relative flex-1 overflow-hidden whitespace-nowrap">
          {/* Gradient Masks */}
          <div className="absolute left-0 inset-y-0 w-8 bg-gradient-to-r from-gov-navy-950 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 inset-y-0 w-8 bg-gradient-to-l from-gov-navy-950 to-transparent z-10 pointer-events-none" />

          {/* Marquee Track */}
          <div className="animate-ticker hover:[animation-play-state:paused] flex items-center space-x-8 cursor-pointer">
            {tickerItems.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                onClick={() => onSelectAnnouncement(item)}
                className="inline-flex items-center space-x-2 text-slate-300 hover:text-gov-gold-400 transition-colors group"
              >
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gov-navy-800 text-gov-gold-400 border border-gov-gold-500/20">
                  {item.category || 'Rasmi'}
                </span>
                <span className="font-medium group-hover:underline">{item.title}</span>
                <span className="text-[11px] text-slate-500">({item.date})</span>
                <span className="text-gov-gold-500/40 ml-4">&bull;</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
