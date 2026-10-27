'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Lock,
  Key,
  AlertCircle,
  Loader2,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, options: any) => void;
          prompt: (momentListener?: any) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'google' | 'passphrase'>('google');
  const [passphrase, setPassphrase] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [detectedAccount, setDetectedAccount] = useState<{
    email: string;
    name?: string;
  } | null>(null);
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  // Check previously detected Google account on mount
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('espb_detected_google_email');
      const savedName = localStorage.getItem('espb_detected_google_name') || undefined;
      if (savedEmail) {
        setDetectedAccount({ email: savedEmail, name: savedName });
      }
    } catch {
      // LocalStorage not available
    }
  }, []);

  // Dynamically load Google Identity Services SDK
  useEffect(() => {
    if (!isOpen) return;

    const existingScript = document.getElementById('google-gsi-client');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => setIsGsiLoaded(true);
      document.body.appendChild(script);
    } else {
      setIsGsiLoaded(true);
    }
  }, [isOpen]);

  // Handle Google Token Response (JWT ID Token)
  const handleCredentialResponse = async (response: { credential?: string }) => {
    if (!response.credential) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Akaun tidak didaftarkan sebagai pentadbir.');
        setIsLoading(false);
        return;
      }

      // Save detected account for instant future access
      if (data.data?.email) {
        try {
          localStorage.setItem('espb_detected_google_email', data.data.email);
          if (data.data.name) {
            localStorage.setItem('espb_detected_google_name', data.data.name);
          }
        } catch {}
      }

      onLoginSuccess();
      onClose();
      router.push('/admin');
    } catch {
      setErrorMessage('Ralat sambungan pelayan semasa mengesahkan akaun Google.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize GIS if Google Client ID is configured
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (isGsiLoaded && window.google?.accounts?.id && clientId) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: true,
        });

        if (googleBtnContainerRef.current) {
          googleBtnContainerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: 'filled_blue',
            size: 'large',
            shape: 'pill',
            text: 'continue_with',
            width: 320,
          });
        }
      } catch (err) {
        console.warn('Google Identity Services initialization warning:', err);
      }
    }
  }, [isGsiLoaded, authMode]);

  if (!isOpen) return null;

  // Trigger Google Workspace Detection / Sign In
  const triggerGoogleDetection = async () => {
    setIsLoading(true);
    setErrorMessage('');

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    // 1. If Google Identity Services is configured with Client ID, invoke official account prompt
    if (window.google?.accounts?.id && clientId) {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setIsLoading(false);
        }
      });
      return;
    }

    // 2. If user already has an active detected email on this browser, log in directly
    if (detectedAccount?.email) {
      try {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: detectedAccount.email }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          setErrorMessage(data.error || 'Akaun Google dikesan tidak mempunyai kebenaran pentadbir.');
          setIsLoading(false);
          return;
        }

        onLoginSuccess();
        onClose();
        router.push('/admin');
        return;
      } catch {
        setErrorMessage('Ralat sambungan pelayan.');
        setIsLoading(false);
        return;
      }
    }

    // 3. Fallback prompt: Ask user to select their active Google/MOE account
    const entered = window.prompt(
      'Kesan Akaun Google Workspace:\nSila masukkan nama akaun Google Workspace (@moe.gov.my) anda yang sedang aktif pada pelayar ini:'
    );

    if (!entered) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: entered.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Akaun tidak didaftarkan sebagai pentadbir.');
        setIsLoading(false);
        return;
      }

      try {
        localStorage.setItem('espb_detected_google_email', entered.trim());
      } catch {}

      onLoginSuccess();
      onClose();
      router.push('/admin');
    } catch {
      setErrorMessage('Ralat sambungan pelayan.');
    } finally {
      setIsLoading(false);
    }
  };

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

  const clearDetectedAccount = () => {
    try {
      localStorage.removeItem('espb_detected_google_email');
      localStorage.removeItem('espb_detected_google_name');
    } catch {}
    setDetectedAccount(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gov-navy-950 rounded-3xl w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gov-gold-500/10 text-gov-gold-600 dark:text-gov-gold-400">
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
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
              setAuthMode('google');
              setErrorMessage('');
            }}
            className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
              authMode === 'google'
                ? 'bg-white dark:bg-gov-navy-800 text-gov-navy-950 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google Workspace</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('passphrase');
              setErrorMessage('');
            }}
            className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
              authMode === 'passphrase'
                ? 'bg-white dark:bg-gov-navy-800 text-gov-navy-950 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Kata Laluan</span>
          </button>
        </div>

        {/* Alert Error */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start space-x-2 text-xs text-red-600 dark:text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab 1: Google Workspace (Auto Detect) */}
        {authMode === 'google' ? (
          <div className="space-y-4">
            {/* Auto Detected Account Card (if found) */}
            {detectedAccount ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-gov-navy-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gov-gold-500/20 text-gov-gold-600 dark:text-gov-gold-400 font-extrabold text-sm flex items-center justify-center flex-shrink-0 border border-gov-gold-500/30">
                    {detectedAccount.email[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Akaun Dikesan
                      </span>
                    </div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate mt-0.5">
                      {detectedAccount.name || detectedAccount.email}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {detectedAccount.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={triggerGoogleDetection}
                    disabled={isLoading}
                    className="flex-1 py-2 px-3 rounded-xl bg-gov-gold-500 hover:bg-gov-gold-600 text-gov-navy-950 font-bold text-xs transition-all shadow-xs flex items-center justify-center space-x-1.5 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5" />
                    )}
                    <span>Teruskan sebagai Akaun Ini</span>
                  </button>

                  <button
                    type="button"
                    onClick={clearDetectedAccount}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs transition-colors"
                    title="Tukar ke akaun Google lain"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-gov-navy-900 dark:to-gov-navy-900/40 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gov-navy-800 border border-slate-200 dark:border-slate-700 mx-auto flex items-center justify-center shadow-xs">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Pengesanan Google Workspace
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Sistem akan mengesan profil akaun rasmi Google Workspace (@moe.gov.my) anda secara automatik tanpa perlu menaip e-mel.
                </p>
              </div>
            )}

            {/* Google Identity Services Render Target (If Client ID set) */}
            <div ref={googleBtnContainerRef} className="flex justify-center my-2" />

            {/* Direct Detection Button */}
            <button
              type="button"
              onClick={triggerGoogleDetection}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-gov-navy-900 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-gov-navy-800 border-2 border-slate-200 dark:border-slate-800 hover:border-gov-gold-500 font-bold text-sm transition-all shadow-xs flex items-center justify-center space-x-2.5 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-gov-gold-500" />
              ) : (
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>
                {isLoading
                  ? 'Mengesahkan Akaun...'
                  : detectedAccount
                  ? 'Kesan Akaun Google Baharu'
                  : 'Kesan & Log Masuk dengan Google'}
              </span>
            </button>

            <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-400 dark:text-slate-500 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Pengesahan selamat rasmi Google Workspace KPM</span>
            </div>
          </div>
        ) : (
          /* Tab 2: Passphrase Form */
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
        )}
      </div>
    </div>
  );
};
