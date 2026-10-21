'use client';

import React from 'react';
import { PortalMeta } from '@/types';
import { MapPin, Phone, Mail, ExternalLink, ShieldCheck } from 'lucide-react';

interface FooterProps {
  meta: PortalMeta;
  onOpenLoginModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ meta, onOpenLoginModal }) => {
  return (
    <footer className="bg-gov-navy-950 text-slate-300 border-t border-gov-navy-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Col 1: Identity */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-white p-1 border border-slate-700">
                <img
                  src={meta.espbLogoUrl}
                  alt="Logo E-SPb"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-white tracking-tight leading-none">
                  {meta.portalName}
                </h3>
                <p className="text-xs text-gov-gold-400 font-medium mt-1">
                  {meta.sectorName} &bull; {meta.district}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed">
              Portal Pengurusan Instruksional, Dokumentasi dan Bimbingan Pedagogi Sekolah Sektor Pembelajaran Pejabat Pendidikan Daerah Beluran.
            </p>

            <div className="pt-2 text-xs text-slate-500">
              Hak Cipta Terpelihara &copy; {meta.currentYear} {meta.district}.
            </div>
          </div>

          {/* Col 2: Hubungi Kami */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gov-gold-400">
              Maklumat Hubungan
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-gov-gold-500 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{meta.address}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gov-gold-500 flex-shrink-0" />
                <span>{meta.contactPhone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gov-gold-500 flex-shrink-0" />
                <a
                  href={`mailto:${meta.contactEmail}`}
                  className="hover:text-gov-gold-400 transition-colors"
                >
                  {meta.contactEmail}
                </a>
              </div>
            </div>
          </div>

          {/* Col 3: Pautan Rasmi & Akses Pentadbir */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gov-gold-400">
              Pautan Pantas
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a
                  href={meta.cartaOrganisasiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gov-gold-400 transition-colors inline-flex items-center space-x-1"
                >
                  <span>Carta Organisasi Sektor</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href={meta.eKeberadaanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gov-gold-400 transition-colors inline-flex items-center space-x-1"
                >
                  <span>Sistem E-Keberadaan</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://d2.delima.edu.my"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gov-gold-400 transition-colors inline-flex items-center space-x-1"
                >
                  <span>Pelantar DELIMa KPM</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li className="pt-2">
                <button
                  onClick={onOpenLoginModal}
                  className="inline-flex items-center space-x-1.5 text-slate-400 hover:text-gov-gold-400 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-gov-gold-500" />
                  <span>Log Masuk Pegawai</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};
