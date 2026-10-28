'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Unit, UnitCategory, PortalMeta, DocumentRecord } from '@/types';
import {
  Menu,
  X,
  Moon,
  Sun,
  Lock,
  ChevronDown,
  Folder,
  Home,
  ExternalLink,
  ShieldCheck,
  Clock,
  Sparkles,
  Type,
  Bell,
  Layers,
  FileText,
} from 'lucide-react';

interface NavbarProps {
  meta: PortalMeta;
  units: Unit[];
  categories?: UnitCategory[];
  activeUnitId?: string | null;
  onSelectUnit?: (unitId: string | null) => void;
  onOpenLoginModal: () => void;
  isAdminLoggedIn?: boolean;
  onPreviewDocument?: (doc: DocumentRecord) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  meta,
  units,
  categories = [],
  activeUnitId,
  onSelectUnit,
  onOpenLoginModal,
  isAdminLoggedIn,
  onPreviewDocument,
}) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUnitsDropdownOpen, setIsUnitsDropdownOpen] = useState(false);
  const [mytTime, setMytTime] = useState<string>('');
  const [isOfficeOpen, setIsOfficeOpen] = useState(true);
  const [fontSizeScale, setFontSizeScale] = useState<'sm' | 'md' | 'lg'>('md');

  // Handle dark mode & font scale initialization
  useEffect(() => {
    const savedTheme = localStorage.getItem('espb_theme');
    const isDark = savedTheme ? savedTheme === 'dark' : true;
    setIsDarkMode(isDark);

    const savedFont = (localStorage.getItem('espb_font_scale') as 'sm' | 'md' | 'lg') || 'md';
    setFontSizeScale(savedFont);
    applyFontScale(savedFont);
  }, []);

  // Live Malaysia Time (MYT) Clock & Office Status
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kuala_Lumpur',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      setMytTime(new Intl.DateTimeFormat('ms-MY', options).format(now));

      const day = now.getDay();
      const hour = now.getHours();
      const isOpen = day >= 1 && day <= 5 && hour >= 8 && hour < 17;
      setIsOfficeOpen(isOpen);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('espb_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('espb_theme', 'light');
    }
  };

  const applyFontScale = (scale: 'sm' | 'md' | 'lg') => {
    document.documentElement.classList.remove('font-scale-sm', 'font-scale-md', 'font-scale-lg');
    document.documentElement.classList.add(`font-scale-${scale}`);
    localStorage.setItem('espb_font_scale', scale);
  };

  const cycleFontScale = () => {
    const nextScale: Record<'sm' | 'md' | 'lg', 'sm' | 'md' | 'lg'> = {
      sm: 'md',
      md: 'lg',
      lg: 'sm',
    };
    const next = nextScale[fontSizeScale];
    setFontSizeScale(next);
    applyFontScale(next);
  };

  const handleUnitClick = (unitId: string | null) => {
    if (onSelectUnit) {
      onSelectUnit(unitId);
    }
    setIsUnitsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  // Group units by category for the dropdown (Unit-unit Sektor Pembelajaran above SISC+)
  const groupedUnits = useMemo(() => {
    if (categories && categories.length > 0) {
      return [...categories]
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((cat) => ({
          categoryId: cat.categoryId,
          categoryName: cat.categoryName,
          units: units
            .filter((u) => u.categoryId === cat.categoryId)
            .sort((a, b) => a.displayOrder - b.displayOrder),
        }));
    }

    // Default fallback groups (Unit-unit Sektor Pembelajaran above SISC+)
    const sisc = units.filter(
      (u) =>
        u.categoryId === 'CAT_SISC' ||
        ['unit-bm', 'unit-bi', 'unit-sains', 'unit-matematik', 'unit-sejarah'].includes(u.unitId)
    );
    const sektor = units.filter((u) => !sisc.includes(u));

    return [
      {
        categoryId: 'CAT_SEKTOR',
        categoryName: 'Unit-unit Sektor Pembelajaran',
        units: sektor,
      },
      {
        categoryId: 'CAT_SISC',
        categoryName: 'SISC+ (School Improvement Specialist Coaches)',
        units: sisc,
      },
    ];
  }, [units, categories]);

  const handleOpenCartaOrganisasi = () => {
    const match = meta.cartaOrganisasiUrl?.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    const matchParam = meta.cartaOrganisasiUrl?.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    const fileId = (match && match[1]) || (matchParam && matchParam[1]) || '1plKZgpVPVOWggd_LS1O9TabTHYkqeU_T';

    if (onPreviewDocument) {
      onPreviewDocument({
        documentId: fileId,
        unitId: 'carta-organisasi',
        title: 'Carta Organisasi Sektor Pembelajaran',
        category: 'Struktur Organisasi',
        description: 'Carta organisasi rasmi Sektor Pembelajaran PPD Beluran',
        fileId,
        fileName: 'Carta Organisasi Sektor Pembelajaran.pdf',
        fileType: 'pdf',
        fileSize: 'PDF',
        displayOrder: 1,
        status: 'active',
        uploadedAt: new Date().toISOString(),
        viewUrl: meta.cartaOrganisasiUrl,
      });
    } else {
      window.open(meta.cartaOrganisasiUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-gov-navy-950/90 backdrop-blur-xl border-b border-slate-200/90 dark:border-slate-800/90 transition-colors shadow-xs">
      {/* Top Sovereign Bar with Live Clock & Accessibility */}
      <div className="bg-gov-navy-950 text-slate-300 text-xs py-1 sm:py-1.5 px-3 sm:px-6 lg:px-8 border-b border-gov-navy-900 select-none">
        <div className="max-w-7xl mx-auto flex flex-row justify-between items-center gap-2">
          {/* Left: Ministry identity & Operational Status */}
          <div className="flex items-center space-x-2 sm:space-x-3 text-[10px] sm:text-xs min-w-0">
            <span className="flex items-center space-x-1.5 min-w-0">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gov-gold-400 animate-pulse shrink-0" />
              <span className="font-semibold text-white tracking-wide truncate">
                {meta.ministry} &bull; {meta.state}
              </span>
            </span>

            <span className="hidden lg:inline text-slate-600">|</span>

            {/* Live Operational Status */}
            <span className="hidden lg:inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gov-navy-900 border border-slate-800 shrink-0">
              <span
                className={`w-1.5 h-1.5 rounded-full ${isOfficeOpen ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
              />
              <span className={isOfficeOpen ? 'text-emerald-400' : 'text-amber-400'}>
                {isOfficeOpen ? 'Kaunter Dibuka (8 AM - 5 PM)' : 'Luar Waktu Pejabat'}
              </span>
            </span>
          </div>

          {/* Right: Live Clock & Accessibility Text Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3 text-[11px] sm:text-xs text-slate-400 shrink-0">
            {mytTime && (
              <div className="hidden sm:flex items-center space-x-1 font-mono text-slate-300">
                <Clock className="w-3.5 h-3.5 text-gov-gold-400" />
                <span>{mytTime}</span>
              </div>
            )}

            <span className="hidden sm:inline text-slate-700">|</span>

            {/* Accessibility Font Resizer */}
            <button
              onClick={cycleFontScale}
              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-gov-navy-900 hover:bg-gov-navy-800 text-slate-300 hover:text-gov-gold-400 border border-slate-800 transition-colors"
              title="Pelaras Saiz Fon (A- / A / A+)"
              aria-label="Tukar Saiz Fon"
            >
              <Type className="w-3 h-3 text-gov-gold-400" />
              <span className="font-bold text-[10px]">
                {fontSizeScale === 'sm' ? 'A-' : fontSizeScale === 'md' ? 'A' : 'A+'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16 lg:h-20">
          {/* Logo & Portal Branding - No White Background on Icon */}
          <div
            onClick={() => handleUnitClick(null)}
            className="flex items-center space-x-2.5 sm:space-x-3.5 cursor-pointer group select-none min-w-0 pr-2"
          >
            <div className="relative w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12 flex-shrink-0 flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform">
              <img
                src={meta.espbLogoUrl}
                alt="Logo E-SPb PPDB"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain drop-shadow"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-serif text-lg sm:text-xl lg:text-2xl font-extrabold tracking-tight text-gov-navy-900 dark:text-white group-hover:text-gov-gold-600 dark:group-hover:text-gov-gold-400 transition-colors leading-none truncate">
                  {meta.portalName}
                </span>
              </div>
              <span className="text-[11px] sm:text-xs lg:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 truncate">
                {meta.sectorName} &bull; {meta.district}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => handleUnitClick(null)}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${!activeUnitId
                  ? 'bg-gov-gold-500/10 text-gov-gold-600 dark:text-gov-gold-400 font-bold'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                }`}
            >
              Laman Utama
            </button>

            {/* Units Dropdown Grouped By Unit Category */}
            <div className="relative">
              <button
                onClick={() => setIsUnitsDropdownOpen(!isUnitsDropdownOpen)}
                className={`flex items-center space-x-1 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${activeUnitId
                    ? 'bg-gov-gold-500/10 text-gov-gold-600 dark:text-gov-gold-400 font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                  }`}
              >
                <span>Unit & Sektor</span>
                <ChevronDown className="w-4 h-4 ml-0.5 opacity-70" />
              </button>

              {isUnitsDropdownOpen && (
                <div
                  className="absolute left-0 mt-2 w-88 bg-white dark:bg-gov-navy-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onMouseLeave={() => setIsUnitsDropdownOpen(false)}
                >
                  <div className="px-4 py-1 text-xs font-bold text-gov-gold-600 dark:text-gov-gold-400 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Pilih Mengikut Jenis Unit</span>
                  </div>

                  <div className="max-h-96 overflow-y-auto px-2 space-y-3">
                    {groupedUnits.map((group) => {
                      if (!group.units || group.units.length === 0) return null;
                      return (
                        <div key={group.categoryId} className="space-y-1">
                          <div className="px-3 pt-1 pb-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-gov-navy-950/60 rounded-lg flex items-center justify-between">
                            <span className="truncate">{group.categoryName}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-gov-gold-500/15 text-gov-gold-600 dark:text-gov-gold-400 font-bold">
                              {group.units.length}
                            </span>
                          </div>

                          <div className="space-y-0.5 pl-1">
                            {group.units.map((u) => {
                              const isExt = Boolean(u.externalLink);
                              return (
                                <button
                                  key={u.unitId}
                                  onClick={() => {
                                    if (isExt && u.externalLink) {
                                      window.open(u.externalLink, '_blank', 'noopener,noreferrer');
                                      setIsUnitsDropdownOpen(false);
                                    } else {
                                      handleUnitClick(u.unitId);
                                    }
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm flex items-center justify-between transition-colors ${activeUnitId === u.unitId
                                      ? 'bg-gov-gold-500/15 text-gov-gold-600 dark:text-gov-gold-400 font-semibold'
                                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                  <div className="flex items-center space-x-2.5 truncate">
                                    <Folder className="w-3.5 h-3.5 text-gov-gold-500 flex-shrink-0" />
                                    <span className="truncate">{u.unitName}</span>
                                  </div>
                                  {isExt && (
                                    <ExternalLink className="w-3.5 h-3.5 text-gov-gold-500 flex-shrink-0 opacity-70 ml-2" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <a
              href="#hebahan"
              className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
            >
              Hebahan
            </a>

            <button
              type="button"
              onClick={handleOpenCartaOrganisasi}
              className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <span>Carta Organisasi</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Tukar Mod Paparan"
              title={isDarkMode ? 'Tukar ke Mod Terang' : 'Tukar ke Mod Gelap'}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-gov-gold-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600" />
              )}
            </button>

            {/* Admin Portal Button */}
            {isAdminLoggedIn ? (
              <Link
                href="/admin"
                className="ml-2 inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-gov-gold-500 hover:bg-gov-gold-600 text-gov-navy-950 font-bold text-xs tracking-wide transition-all shadow-sm hover:shadow"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Panel Pentadbir</span>
              </Link>
            ) : (
              <button
                onClick={onOpenLoginModal}
                className="ml-2 inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-gov-gold-500 dark:hover:border-gov-gold-500 text-slate-700 dark:text-slate-200 hover:text-gov-gold-600 dark:hover:text-gov-gold-400 text-xs font-semibold tracking-wide transition-all"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Log Masuk</span>
              </button>
            )}
          </nav>

          {/* Mobile Actions: Dark Mode & Drawer Toggle */}
          <div className="flex items-center space-x-2 md:hidden">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Tukar Tema"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-gov-gold-400" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Menu Navigasi"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-gov-navy-950/95 backdrop-blur-xl px-4 pt-3 pb-5 space-y-2 max-h-[calc(100dvh-5.5rem)] overflow-y-auto animate-in slide-in-from-top-2">
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => handleUnitClick(null)}
              className="text-center px-2 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100/80 dark:bg-gov-navy-900 hover:bg-slate-200 dark:hover:bg-slate-800 flex flex-col items-center justify-center gap-1"
            >
              <Home className="w-4 h-4 text-gov-gold-500" />
              <span>Utama</span>
            </button>

            <a
              href="#hebahan"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-center px-2 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100/80 dark:bg-gov-navy-900 hover:bg-slate-200 dark:hover:bg-slate-800 flex flex-col items-center justify-center gap-1"
            >
              <Bell className="w-4 h-4 text-gov-gold-500" />
              <span>Hebahan</span>
            </a>

            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleOpenCartaOrganisasi();
              }}
              className="text-center px-2 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100/80 dark:bg-gov-navy-900 hover:bg-slate-200 dark:hover:bg-slate-800 flex flex-col items-center justify-center gap-1 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-gov-gold-500" />
              <span>Carta</span>
            </button>
          </div>

          <div className="pt-1.5 pb-0.5 px-1 text-[11px] font-bold text-gov-gold-600 dark:text-gov-gold-400 uppercase tracking-wider">
            Senarai Unit Mengikut Kategori
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1">
            {groupedUnits.map((group) => {
              if (!group.units || group.units.length === 0) return null;
              return (
                <div key={group.categoryId} className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide px-2 py-0.5 bg-slate-100 dark:bg-gov-navy-900 rounded">
                    {group.categoryName}
                  </div>
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-1">
                    {group.units.map((u) => {
                      const isExt = Boolean(u.externalLink);
                      return (
                        <button
                          key={u.unitId}
                          onClick={() => {
                            if (isExt && u.externalLink) {
                              window.open(u.externalLink, '_blank', 'noopener,noreferrer');
                              setIsMobileMenuOpen(false);
                            } else {
                              handleUnitClick(u.unitId);
                            }
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${activeUnitId === u.unitId
                              ? 'bg-gov-gold-500/15 text-gov-gold-600 dark:text-gov-gold-400 font-semibold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gov-navy-900/60'
                            }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <Folder className="w-3 h-3 text-gov-gold-500 flex-shrink-0" />
                            <span className="truncate">{u.unitName}</span>
                          </div>
                          {isExt && (
                            <ExternalLink className="w-3 h-3 text-gov-gold-500 flex-shrink-0 opacity-70 ml-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            {isAdminLoggedIn ? (
              <Link
                href="/admin"
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gov-gold-500 text-gov-navy-950 font-bold text-sm shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Panel Pentadbir</span>
              </Link>
            ) : (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenLoginModal();
                }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm"
              >
                <Lock className="w-4 h-4" />
                <span>Log Masuk Pegawai</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
