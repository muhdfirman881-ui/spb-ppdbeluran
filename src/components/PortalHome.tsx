'use client';

import React, { useState, useEffect } from 'react';
import {
  InitialPortalData,
  UnitPortalData,
  DocumentRecord,
  Announcement,
} from '@/types';
import dynamic from 'next/dynamic';
import { Navbar } from './Navbar';
import { HeroCarousel } from './HeroCarousel';
import { NewsTicker } from './NewsTicker';
import { SectorStatsSection } from './SectorStatsSection';
import { QuickAccessSection } from './QuickAccessSection';
import { AnnouncementsSection } from './AnnouncementsSection';
import { UnitsSection } from './UnitsSection';
import { ScrollProgressAndTop } from './ScrollProgressAndTop';
import { Footer } from './Footer';
import { Loader2 } from 'lucide-react';

const UnitDetailView = dynamic(
  () => import('./UnitDetailView').then((m) => m.UnitDetailView),
  {
    loading: () => (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-gov-gold-500" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Memuatkan maklumat unit sektor...
        </p>
      </div>
    ),
    ssr: false,
  }
);

const DocumentPreviewModal = dynamic(
  () => import('./DocumentPreviewModal').then((m) => m.DocumentPreviewModal),
  { ssr: false }
);

const AdminLoginModal = dynamic(
  () => import('./AdminLoginModal').then((m) => m.AdminLoginModal),
  { ssr: false }
);

interface PortalHomeProps {
  initialData: InitialPortalData;
}

export const PortalHome: React.FC<PortalHomeProps> = ({ initialData }) => {
  const [data, setData] = useState<InitialPortalData>(initialData);
  const [activeUnitId, setActiveUnitId] = useState<string | null>(null);
  const [activeUnitData, setActiveUnitData] = useState<UnitPortalData | null>(null);
  const [isLoadingUnit, setIsLoadingUnit] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Check initial admin session status
  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.authenticated) {
          setIsAdminLoggedIn(true);
        }
      })
      .catch(() => {});
  }, []);

  // Handle URL hash / search params on initial mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const unitParam = params.get('unit');
    if (unitParam) {
      handleSelectUnit(unitParam);
    }
  }, [data.unitRegistry]);

  const handleSelectUnit = async (unitId: string | null) => {
    if (!unitId) {
      setActiveUnitId(null);
      setActiveUnitData(null);
      window.history.pushState({}, '', window.location.pathname);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setActiveUnitId(unitId);
    setIsLoadingUnit(true);
    window.history.pushState({}, '', `?unit=${unitId}`);

    try {
      const res = await fetch(`/api/portal/units/${unitId}`);
      const resJson = await res.json();
      if (resJson.success && resJson.data) {
        setActiveUnitData(resJson.data);
      }
    } catch (err) {
      console.error('Failed to load unit data:', err);
    } finally {
      setIsLoadingUnit(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleTickerSelect = (announcement: Announcement) => {
    const el = document.getElementById('hebahan');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gov-navy-950 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Sovereign Navbar */}
      <Navbar
        meta={data.meta}
        units={data.unitRegistry}
        categories={data.navigationData.categories}
        activeUnitId={activeUnitId}
        onSelectUnit={handleSelectUnit}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {isLoadingUnit ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-gov-gold-500" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Memuatkan data unit sektor...
            </p>
          </div>
        ) : activeUnitData ? (
          <UnitDetailView
            unitData={activeUnitData}
            onBack={() => handleSelectUnit(null)}
            onPreviewDocument={(doc) => setPreviewDoc(doc)}
          />
        ) : (
          <>
            {/* Hero Slider */}
            <HeroCarousel slides={data.heroAlbum} />

            {/* Breaking News Ticker */}
            <NewsTicker
              announcements={data.announcements}
              onSelectAnnouncement={handleTickerSelect}
            />

            {/* Sektor Impact Metrics & Highlights */}
            <SectorStatsSection />

            {/* Quick Access Digital Services */}
            <QuickAccessSection
              services={data.quickAccess}
              onSelectSisc={() => {
                const el = document.getElementById('unit');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Announcements */}
            <AnnouncementsSection announcements={data.announcements} />

            {/* Units & Sector Structure */}
            <UnitsSection
              categories={data.navigationData.categories}
              units={data.unitRegistry}
              onSelectUnit={handleSelectUnit}
            />
          </>
        )}
      </main>

      {/* Sovereign Government Footer with Interactive Map */}
      <Footer
        meta={data.meta}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
      />

      {/* Circular Scroll Progress & Back To Top */}
      <ScrollProgressAndTop />

      {/* Document In-App Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {/* Admin Login Dialog */}
      {isLoginModalOpen && (
        <AdminLoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={() => setIsAdminLoggedIn(true)}
        />
      )}
    </div>
  );
};
