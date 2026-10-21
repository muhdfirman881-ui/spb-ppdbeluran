'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Lock, Key, Mail, AlertCircle, Loader2 } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'passphrase' | 'google'>('passphrase');
  const [passphrase, setPassphrase] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handlePassphraseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Kata laluan salah.');
        setIsLoading(false);
        return;
      }

      onLoginSuccess();
      onClose();
      router.push('/admin');
    } catch {
      setErrorMessage('Ralat sambungan pelayan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Akaun tidak didaftarkan sebagai pentadbir.');
        setIsLoading(false);
        return;
      }

      onLoginSuccess();
      onClose();
      router.push('/admin');
    } catch {
      setErrorMessage('Ralat sambungan pelayan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gov-navy-950 rounded-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-gov-gold-500/10 text-gov-gold-600 dark:text-gov-gold-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Log Masuk Pentadbir
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sektor Pembelajaran PPD Beluran
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex p-1 bg-slate-100 dark:bg-gov-navy-900 rounded-xl my-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setAuthMode('passphrase');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 rounded-lg transition-colors ${
              authMode === 'passphrase'
                ? 'bg-white dark:bg-gov-navy-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Kata Laluan
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('google');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 rounded-lg transition-colors ${
              authMode === 'google'
                ? 'bg-white dark:bg-gov-navy-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Google Workspace
          </button>
        </div>

        {/* Alert Error */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start space-x-2 text-xs text-red-600 dark:text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Passphrase Form */}
        {authMode === 'passphrase' ? (
          <form onSubmit={handlePassphraseSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Kata Laluan Pentadbir
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Masukkan kata laluan..."
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-gov-navy-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:border-gov-gold-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-gov-gold-500 hover:bg-gov-gold-600 text-gov-navy-950 font-bold text-sm transition-all shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isLoading ? 'Mengesahkan...' : 'Log Masuk'}</span>
            </button>
          </form>
        ) : (
          /* Google Form */
          <form onSubmit={handleGoogleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                E-mel Google Workspace (@moe.gov.my)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="nama.pegawai@moe.gov.my"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-gov-navy-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:border-gov-gold-500"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-400">
                Sistem akan menyemak e-mel ini dalam direktori pentadbir sektor.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-gov-navy-900 dark:bg-gov-gold-500 text-white dark:text-gov-navy-950 hover:bg-gov-navy-800 dark:hover:bg-gov-gold-600 font-bold text-sm transition-all shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isLoading ? 'Menyemak E-mel...' : 'Sahkan & Log Masuk'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
