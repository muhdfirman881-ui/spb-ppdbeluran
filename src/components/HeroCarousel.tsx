'use client';

import React, { useState, useEffect, useRef } from 'react';
import { HeroSlide } from '@/types';
import { ChevronLeft, ChevronRight, Pause, Play, Sparkles } from 'lucide-react';
import { getOptimizedImageUrl } from '@/lib/config';

interface HeroCarouselProps {
  slides: HeroSlide[];
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ slides }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const slideDuration = 6000; // 6 seconds per slide
  const intervalStep = 50; // update progress every 50ms

  const total = slides.length;

  useEffect(() => {
    if (total <= 1) return;

    if (isPaused) {
      return;
    }

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveIndex((current) => (current + 1) % total);
          return 0;
        }
        return prev + (intervalStep / slideDuration) * 100;
      });
    }, intervalStep);

    return () => clearInterval(timer);
  }, [total, isPaused, slideDuration]);

  // Reset progress when index changes manually
  const changeSlide = (newIndex: number) => {
    setProgress(0);
    setActiveIndex(newIndex);
  };

  const goToNext = () => {
    changeSlide((activeIndex + 1) % total);
  };

  const goToPrev = () => {
    changeSlide((activeIndex - 1 + total) % total);
  };

  if (total === 0) return null;

  return (
    <section
      className="relative w-full overflow-hidden bg-gov-navy-950 select-none group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Album Hero Portal"
    >
      {/* Slider Viewport */}
      <div className="relative h-72 sm:h-96 md:h-[520px] lg:h-[560px] w-full">
        {slides.map((slide, idx) => {
          const isActive = idx === activeIndex;

          return (
            <div
              key={slide.id || idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Image with subtle Ken Burns zoom */}
              <div className="w-full h-full overflow-hidden">
                <img
                  src={getOptimizedImageUrl(slide.imageUrl)}
                  alt={slide.fileName || `Slaid ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  decoding={idx === 0 ? 'sync' : 'async'}
                  // @ts-ignore fetchPriority is supported in React 18.3
                  fetchPriority={idx === 0 ? 'high' : 'low'}
                  className={`w-full h-full object-cover object-center transform transition-transform duration-[8000ms] ease-out ${
                    isActive ? 'scale-105' : 'scale-100'
                  }`}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.dataset.triedDirect && slide.imageUrl.includes('lh3.googleusercontent.com')) {
                      target.dataset.triedDirect = 'true';
                      target.src = slide.imageUrl;
                    } else {
                      target.src =
                        'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1600&q=80';
                    }
                  }}
                />
              </div>

              {/* Multi-layer Cinematic Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-gov-navy-950 via-gov-navy-950/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-gov-navy-950/90 via-gov-navy-950/40 to-transparent" />

              {/* Slide Content Caption */}
              <div className="absolute bottom-16 sm:bottom-20 left-6 sm:left-12 lg:left-20 max-w-3xl z-20 space-y-3">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-gov-gold-500/90 text-gov-navy-950 backdrop-blur-md shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-gov-navy-950" />
                  <span>Sorotan Rasmi Sektor</span>
                </div>

                <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight drop-shadow-md leading-tight">
                  {slide.fileName || 'Inisiatif Pengupayaan Pedagogi & Kurikulum'}
                </h2>

                <p className="text-xs sm:text-base text-slate-300 max-w-xl drop-shadow line-clamp-2">
                  Memperkasa kecemerlangan kepimpinan instruksional sekolah dan bimbingan guru daerah Beluran.
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Controls */}
      {total > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-gov-navy-950/60 hover:bg-gov-gold-500 text-white hover:text-gov-navy-950 backdrop-blur-md border border-white/10 shadow-lg transition-all duration-200"
            aria-label="Slaid Sebelumnya"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-gov-navy-950/60 hover:bg-gov-gold-500 text-white hover:text-gov-navy-950 backdrop-blur-md border border-white/10 shadow-lg transition-all duration-200"
            aria-label="Slaid Seterusnya"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Premium Progress Bar Indicators (Linear Timeline) */}
          <div className="absolute bottom-6 left-6 right-6 sm:left-12 sm:right-12 lg:left-20 lg:right-20 z-20 flex items-center justify-between gap-4">
            {/* Linear Progress Bars */}
            <div className="flex-1 flex items-center space-x-2 sm:space-x-3 max-w-md">
              {slides.map((_, idx) => {
                const isActive = idx === activeIndex;
                const isPassed = idx < activeIndex;

                return (
                  <button
                    key={idx}
                    onClick={() => changeSlide(idx)}
                    className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden relative transition-all group/bar"
                    aria-label={`Pergi ke slaid ${idx + 1}`}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-75 ${
                        isActive
                          ? 'bg-gov-gold-400'
                          : isPassed
                          ? 'bg-white/80 w-full'
                          : 'bg-transparent w-0'
                      }`}
                      style={{
                        width: isActive ? `${progress}%` : isPassed ? '100%' : '0%',
                      }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Slide Counter & Play/Pause State */}
            <div className="flex items-center space-x-3 text-xs text-slate-300 font-mono">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="p-1 rounded-md hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                title={isPaused ? 'Sambung semula' : 'Jeda slaid'}
              >
                {isPaused ? <Play className="w-3.5 h-3.5 text-gov-gold-400" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
              <span className="font-semibold text-white">
                {String(activeIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
              </span>
            </div>
          </div>
        </>
      )}
    </section>
  );
};
