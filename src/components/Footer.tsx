'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PortalMeta } from '@/types';
import {
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  ShieldCheck,
  Navigation,
  Clock,
  Copy,
  Check,
  Compass,
  Building2,
  Map,
} from 'lucide-react';

interface FooterProps {
  meta: PortalMeta;
  onOpenLoginModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ meta, onOpenLoginModal }) => {
  const [copied, setCopied] = useState(false);
  const [isOpenNow, setIsOpenNow] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Check office hours (Mon-Fri 8am-5pm MYT)
  useEffect(() => {
    const checkOfficeHours = () => {
      try {
        const now = new Date();
        const utc = now.getTime() + now.getTimezoneOffset() * 60000;
        const myt = new Date(utc + 3600000 * 8);
        const day = myt.getDay();
        const hour = myt.getHours();

        const isWorkingDay = day >= 1 && day <= 5;
        const isWorkingHours = hour >= 8 && hour < 17;

        setIsOpenNow(isWorkingDay && isWorkingHours);
      } catch (_) {
        setIsOpenNow(true);
      }
    };

    checkOfficeHours();
    const interval = setInterval(checkOfficeHours, 60000);
    return () => clearInterval(interval);
  }, []);

  // Performance Optimization: Lazy Load Google Maps on scroll (Facade Pattern)
  useEffect(() => {
    if (isMapLoaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsMapLoaded(true);
          observer.disconnect();
        }
      },
      { rootMargin: '350px' }
    );

    if (mapContainerRef.current) {
      observer.observe(mapContainerRef.current);
    }

    return () => observer.disconnect();
  }, [isMapLoaded]);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(meta.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const mapEmbedUrl =
    'https://maps.google.com/maps?q=Pejabat+Pendidikan+Daerah+Beluran,+Peti+Surat+27,+90107+Beluran,+Sabah&t=&z=15&ie=UTF8&iwloc=&output=embed';
  const googleMapsDirectionsUrl =
    'https://www.google.com/maps/search/?api=1&query=Pejabat+Pendidikan+Daerah+Beluran+Sabah';
  const wazeDirectionsUrl =
    'https://waze.com/ul?q=Pejabat+Pendidikan+Daerah+Beluran';

  return (
    <footer className="relative bg-gov-navy-950 text-slate-300 border-t border-gov-navy-900 mt-auto overflow-hidden">
      {/* Decorative ambient background glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gov-gold-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-80 h-80 bg-gov-navy-700/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Footer Container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Identity, Description, Contact Details & Admin Access (6 cols) */}
          <div className="lg:col-span-6 space-y-5">
            {/* Branding Header - Exact dimension constraint on logo */}
            <div className="flex items-center space-x-3.5">
              <div
                className="w-12 h-12 flex-shrink-0 flex items-center justify-center overflow-hidden"
                style={{ width: '48px', height: '48px', maxWidth: '48px', maxHeight: '48px' }}
              >
                <img
                  src={meta.espbLogoUrl}
                  alt="Logo E-SPb"
                  referrerPolicy="no-referrer"
                  style={{ width: '48px', height: '48px', maxWidth: '48px', maxHeight: '48px' }}
                  className="w-12 h-12 object-contain drop-shadow"
                />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-serif text-2xl font-extrabold text-white tracking-tight leading-tight">
                    {meta.portalName}
                  </h3>
                </div>
                <p className="text-xs text-gov-gold-400 font-semibold mt-0.5">
                  {meta.sectorName} &bull; {meta.district}
                </p>
                <p className="text-[11px] text-slate-400">
                  {meta.ministry}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              Portal Instruksional Rasmi Sektor Pembelajaran PPD Beluran — Memacu kecemerlangan pedagogi, bimbingan SISC+, dan pendigitalan repositori kurikulum sekolah daerah Beluran, Sabah.
            </p>

            {/* Quick Contact Badges */}
            <div className="space-y-3 pt-1">
              <div className="flex items-start space-x-3 text-xs text-slate-300">
                <div className="p-2 rounded-xl bg-gov-navy-900 border border-slate-800 text-gov-gold-400 flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">Alamat Pejabat:</p>
                  <p className="text-slate-400 leading-relaxed mt-0.5">{meta.address}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex items-center space-x-2.5 p-3 rounded-xl bg-gov-navy-900/90 border border-slate-800 text-xs">
                  <Phone className="w-4 h-4 text-gov-gold-400 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Talian Telefon</div>
                    <span className="font-semibold text-white">{meta.contactPhone}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5 p-3 rounded-xl bg-gov-navy-900/90 border border-slate-800 text-xs">
                  <Mail className="w-4 h-4 text-gov-gold-400 flex-shrink-0" />
                  <div className="overflow-hidden">
                    <div className="text-[10px] uppercase font-bold text-slate-400">E-mel Rasmi</div>
                    <a
                      href={`mailto:${meta.contactEmail}`}
                      className="font-semibold text-gov-gold-400 hover:underline truncate block"
                      title={meta.contactEmail}
                    >
                      {meta.contactEmail}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Operating Hours & Admin Login Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <div className="flex-1 p-3.5 rounded-xl bg-gov-navy-900/90 border border-gov-navy-800 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Clock className="w-4 h-4 text-gov-gold-400" />
                  <div className="text-xs">
                    <div className="text-slate-200 font-semibold">Waktu Operasi Kaunter</div>
                    <div className="text-[11px] text-slate-400">Isnin – Jumaat: 8.00 AM – 5.00 PM</div>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                    isOpenNow
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse ${
                      isOpenNow ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  {isOpenNow ? 'Dibuka' : 'Tutup'}
                </span>
              </div>

              <button
                onClick={onOpenLoginModal}
                className="inline-flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-gov-navy-900 hover:bg-gov-gold-500 text-gov-gold-400 hover:text-gov-navy-950 font-bold text-xs border border-gov-gold-500/30 transition-all duration-200 shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Log Masuk Pegawai</span>
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Map Pejabat Pendidikan Daerah Beluran (6 cols) */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gov-gold-400 flex items-center space-x-2">
                <Compass className="w-4 h-4" />
                <span>Lokasi & Peta Rasmi PPD Beluran</span>
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">
                5.8943° U, 117.5593° T
              </span>
            </div>

            {/* Premium Interactive Map Card with Lazy Facade Pattern */}
            <div
              ref={mapContainerRef}
              className="relative rounded-2xl overflow-hidden border border-slate-800 bg-gov-navy-900 shadow-2xl group"
            >
              {/* Map Viewport */}
              <div className="relative w-full h-64 sm:h-72 bg-slate-900 flex items-center justify-center">
                {isMapLoaded ? (
                  <iframe
                    title="Peta Pejabat Pendidikan Daerah Beluran"
                    src={mapEmbedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0, filter: 'contrast(1.05) saturate(1.1)' }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-full object-cover animate-in fade-in duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-gov-gold-500/10 flex items-center justify-center text-gov-gold-400">
                      <Map className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Pejabat Pendidikan Daerah Beluran</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Memuatkan peta interaktif...</p>
                    </div>
                    <button
                      onClick={() => setIsMapLoaded(true)}
                      className="px-3.5 py-1.5 rounded-lg bg-gov-gold-500/20 hover:bg-gov-gold-500 text-gov-gold-400 hover:text-gov-navy-950 font-bold text-xs transition-colors border border-gov-gold-500/30"
                    >
                      Buka Peta Interaktif
                    </button>
                  </div>
                )}

                {/* Floating Map Pin Badge */}
                <div className="absolute top-3 left-3 z-10 flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gov-navy-950/90 text-white backdrop-blur-md border border-slate-700 shadow-lg text-xs">
                  <Building2 className="w-3.5 h-3.5 text-gov-gold-400" />
                  <span className="font-bold">PPD Beluran, Sabah</span>
                </div>
              </div>

              {/* Map Footer Action Bar */}
              <div className="p-3.5 bg-gov-navy-950/95 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center space-x-2">
                  <a
                    href={googleMapsDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gov-gold-500/15 hover:bg-gov-gold-500 text-gov-gold-400 hover:text-gov-navy-950 text-xs font-semibold border border-gov-gold-500/30 transition-all duration-200"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Arah Google Maps</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>

                  <a
                    href={wazeDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all duration-200"
                  >
                    <Compass className="w-3.5 h-3.5 text-sky-400" />
                    <span>Waze</span>
                  </a>
                </div>

                <button
                  onClick={handleCopyAddress}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs transition-colors border border-slate-700/80"
                  title="Salin alamat pejabat"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Salin Alamat</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed italic">
              Petunjuk: Pejabat Pendidikan Daerah Beluran terletak bersebelahan Kompleks Pentadbiran Daerah Beluran, Sabah.
            </p>
          </div>

        </div>

        {/* Bottom Sub-Footer */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-1 gap-x-4">
            <p className="font-semibold text-slate-200">
              Aplikasi dibangunkan oleh Pasukan Teknikal ICT Sekolah PPD Beluran
            </p>
            <span className="hidden md:inline text-slate-600">&bull;</span>
            <p className="text-slate-400">
              Sektor Pembelajaran Pejabat Pendidikan Daerah Beluran, Sabah
            </p>
          </div>

          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span>Dasar Privasi</span>
            <span className="text-slate-600">&bull;</span>
            <span>Penafian Keselamatan</span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-gov-gold-400 font-mono">PPD0202</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
