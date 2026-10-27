'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export const ScrollProgressAndTop: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress = window.scrollY;

      if (totalScroll > 0) {
        setScrollProgress((currentProgress / totalScroll) * 100);
      }

      if (currentProgress > 280) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // SVG circle calculation
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <div
      className={`fixed bottom-6 right-6 z-40 transition-all duration-300 ${
        isVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <button
        onClick={scrollToTop}
        className="relative group w-12 h-12 rounded-full bg-white dark:bg-gov-navy-900 border border-slate-200 dark:border-slate-700 shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
        aria-label="Kembali ke atas"
        title="Kembali ke atas halaman"
      >
        {/* SVG Progress Ring */}
        <svg className="w-12 h-12 -rotate-90 pointer-events-none absolute inset-0">
          <circle
            cx="24"
            cy="24"
            r={radius}
            className="stroke-slate-200 dark:stroke-slate-800"
            strokeWidth="2.5"
            fill="transparent"
          />
          <circle
            cx="24"
            cy="24"
            r={radius}
            className="stroke-gov-gold-500 transition-all duration-150"
            strokeWidth="2.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Center Icon */}
        <ArrowUp className="w-4 h-4 text-gov-navy-900 dark:text-white group-hover:text-gov-gold-500 group-hover:-translate-y-0.5 transition-all" />
      </button>
    </div>
  );
};
