'use client';

import React, { useState, useEffect, useRef } from 'react';
import { HeroSlide } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroCarouselProps {
  slides: HeroSlide[];
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ slides }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const total = slides.length;

  useEffect(() => {
    if (total <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, isPaused]);

  if (total === 0) return null;

  const goToNext = () => {
    setActiveIndex((prev) => (prev + 1) % total);
  };

  const goToPrev = () => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  return (
    <section
      className="relative w-full overflow-hidden bg-gov-navy-950 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Album Hero Portal"
    >
      {/* Slider Viewport */}
      <div className="relative h-64 sm:h-96 md:h-[480px] w-full">
        {slides.map((slide, idx) => (
          <div
            key={slide.id || idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <img
              src={slide.imageUrl}
              alt={slide.fileName || `Slaid ${idx + 1}`}
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                // Fallback to stylized geometric banner if remote image fails
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1600&q=80';
              }}
            />
            {/* Cinematic Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-gov-navy-950 via-gov-navy-950/40 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-gov-navy-950/80 via-transparent to-transparent"></div>

            {/* Slide Caption */}
            {slide.fileName && (
              <div className="absolute bottom-10 left-6 sm:left-12 lg:left-20 max-w-2xl z-20">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-gov-gold-500/90 text-gov-navy-950 mb-2">
                  Sorotan Rasmi
                </span>
                <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight drop-shadow-md leading-tight">
                  {slide.fileName}
                </h2>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Controls */}
      {total > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/40 hover:bg-gov-gold-500 text-white hover:text-gov-navy-950 backdrop-blur-sm transition-all"
            aria-label="Slaid Sebelumnya"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/40 hover:bg-gov-gold-500 text-white hover:text-gov-navy-950 backdrop-blur-sm transition-all"
            aria-label="Slaid Seterusnya"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`transition-all duration-300 rounded-full ${
                  idx === activeIndex
                    ? 'w-8 h-2.5 bg-gov-gold-400'
                    : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Pergi ke slaid ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};
