'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Unit, PortalMeta } from '@/types';
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
} from 'lucide-react';

interface NavbarProps {
  meta: PortalMeta;
  units: Unit[];
  activeUnitId?: string | null;
  onSelectUnit?: (unitId: string | null) => void;
  onOpenLoginModal: () => void;
  isAdminLoggedIn?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  meta,
  units,
  activeUnitId,
  onSelectUnit,
  onOpenLoginModal,
  isAdminLoggedIn,
}) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUnitsDropdownOpen, setIsUnitsDropdownOpen] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
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

  const handleUnitClick = (unitId: string | null) => {
    if (onSelectUnit) {
      onSelectUnit(unitId);
    }
    setIsUnitsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-gov-navy-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Top Sovereign Bar */}
      <div className="bg-gov-navy-900 text-slate-200 text-xs py-1.5 px-4 sm:px-8 border-b border-gov-navy-800">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-gov-gold-500 animate-pulse"></span>
            <span className="font-medium tracking-wide">
              {meta.ministry} &bull; {meta.state}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="hidden sm:inline text-slate-400">Tel: {meta.contactPhone}</span>
            <a
              href={`mailto:${meta.contactEmail}`}
              className="text-gov-gold-400 hover:text-gov-gold-200 transition-colors hidden md:inline"
            >
              {meta.contactEmail}
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo & Portal Branding */}
          <div
            onClick={() => handleUnitClick(null)}
            className="flex items-center space-x-3.5 cursor-pointer group select-none"
          >
            <div className="relative w-12 h-12 flex-shrink-0 bg-white p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <img
                src={meta.espbLogoUrl}
                alt="Logo E-SPb PPDB"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-gov-navy-900 dark:text-white group-hover:text-gov-gold-600 transition-colors leading-none">
                {meta.portalName}
              </span>
              <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                {meta.sectorName} &bull; {meta.district}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => handleUnitClick(null)}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                !activeUnitId
                  ? 'bg-gov-gold-50 dark:bg-gov-navy-800 text-gov-gold-600 dark:text-gov-gold-400 font-semibold'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Utama
            </button>

            {/* Units Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUnitsDropdownOpen(!isUnitsDropdownOpen)}
                className={`flex items-center space-x-1 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeUnitId
                    ? 'bg-gov-gold-50 dark:bg-gov-navy-800 text-gov-gold-600 dark:text-gov-gold-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>Unit & Sektor</span>
                <ChevronDown className="w-4 h-4 ml-0.5 opacity-70" />
              </button>

              {isUnitsDropdownOpen && (
                <div
                  className="absolute left-0 mt-2 w-72 bg-white dark:bg-gov-navy-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onMouseLeave={() => setIsUnitsDropdownOpen(false)}
                >
                  <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Pilih Unit Sektor
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {units.map((u) => (
                      <button
                        key={u.unitId}
                        onClick={() => handleUnitClick(u.unitId)}
                        className={`w-full text-left px-3.5 py-2.5 text-xs sm:text-sm flex items-center space-x-2.5 transition-colors ${
                          activeUnitId === u.unitId
                            ? 'bg-gov-gold-500/10 text-gov-gold-600 dark:text-gov-gold-400 font-medium'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Folder className="w-4 h-4 text-gov-gold-500 flex-shrink-0" />
                        <span className="truncate">{u.unitName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <a
              href="#hebahan"
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Hebahan
            </a>

            <a
              href={meta.cartaOrganisasiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center space-x-1"
            >
              <span>Carta Organisasi</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </a>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Tukar Mod Paparan"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-gov-gold-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>

            {/* Admin Portal Button */}
            {isAdminLoggedIn ? (
              <Link
                href="/admin"
                className="ml-2 inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-gov-gold-500 hover:bg-gov-gold-600 text-gov-navy-950 font-semibold text-xs tracking-wide transition-all shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Panel Pentadbir</span>
              </Link>
            ) : (
              <button
                onClick={onOpenLoginModal}
                className="ml-2 inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-gov-gold-500 dark:hover:border-gov-gold-500 text-slate-700 dark:text-slate-200 hover:text-gov-gold-600 dark:hover:text-gov-gold-400 text-xs font-semibold tracking-wide transition-all"
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
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Tukar Tema"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-gov-gold-400" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Menu Navigasi"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-gov-navy-950 px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2">
          <button
            onClick={() => handleUnitClick(null)}
            className="w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2"
          >
            <Home className="w-4 h-4 text-gov-gold-500" />
            <span>Laman Utama</span>
          </button>

          <div className="pt-2 pb-1 px-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Senarai Unit Sektor
          </div>
          <div className="max-h-48 overflow-y-auto pl-2 space-y-1">
            {units.map((u) => (
              <button
                key={u.unitId}
                onClick={() => handleUnitClick(u.unitId)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center space-x-2 ${
                  activeUnitId === u.unitId
                    ? 'bg-gov-gold-500/10 text-gov-gold-600 dark:text-gov-gold-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <Folder className="w-3.5 h-3.5 text-gov-gold-500" />
                <span className="truncate">{u.unitName}</span>
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            {isAdminLoggedIn ? (
              <Link
                href="/admin"
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-gov-gold-500 text-gov-navy-950 font-bold text-sm"
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
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm"
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
