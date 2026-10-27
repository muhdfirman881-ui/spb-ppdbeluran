'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Lock,
  AlertCircle,
  Loader2,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  ExternalLink,
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
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState<{
    code: string;
    email?: string;
  } | null>(null);
  const [lastAccount, setLastAccount] = useState<{
    email: string;
    name?: string;
  } | null>(null);
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  // Read URL search params for authentication feedback from OAuth callback
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    try {
      const params = new URLSearchParams(window.location.search);
      const authError = params.get('auth_error');
      const returnedEmail = params.get('email');

      if (authError) {
        setErrorDetails({
          code: authError,
          email: returnedEmail || undefined,
        });

        if (authError === 'unauthorized') {
          setErrorMessage(
            `Akaun Google anda (${returnedEmail || 'ini'}) telah disahkan oleh Google, namun e-mel ini TIDAK didaftarkan sebagai Pentadbir Sistem di Google Sheets PPD Beluran.`
          );
        } else if (authError === 'oauth_not_configured') {
          setErrorMessage(
            'Kelayakan Google OAuth 2.0 (GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET) belum dimasukkan ke dalam fail .env.local di pelayan.'
          );
        } else if (authError === 'csrf_failed') {
          setErrorMessage(
            'Sesi pengesahan tamat tempoh atau token keselamatan tidak sepadan (CSRF). Sila cuba log masuk semula.'
          );
        } else if (authError === 'access_denied') {
          setErrorMessage('Log masuk Google dibatalkan oleh pengguna.');
        } else if (authError === 'token_exchange_failed') {
          setErrorMessage('Ralat komunikasi semasa menukar token pengesahan dengan pelayan Google.');
        } else if (authError === 'unverified_email') {
          setErrorMessage('Akaun Google anda tidak mempunyai alamat e-mel yang sah atau disahkan oleh Google.');
        } else {
          setErrorMessage(`Ralat pengesahan Google: ${authError}`);
        }
      }
    } catch {
      // Window search params reading error
    }
  }, [isOpen]);

  // Check last verified Google account on mount
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('espb_last_admin_email');
      const savedName = localStorage.getItem('espb_last_admin_name') || undefined;
      if (savedEmail) {
        setLastAccount({ email: savedEmail, name: savedName });
      }
    } catch {
      // LocalStorage not available
    }
  }, []);

  // Dynamically load Google Identity Services SDK for One Tap/Button if client ID is set
  useEffect(() => {
    if (!isOpen) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

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

  // Handle Google Token Response (JWT ID Token) if One-Tap or GIS button is used
  const handleCredentialResponse = React.useCallback(
    async (response: { credential?: string }) => {
      if (!response.credential) return;

      setIsLoading(true);
      setErrorMessage('');
      setErrorDetails(null);

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

        if (data.data?.email) {
          try {
            localStorage.setItem('espb_last_admin_email', data.data.email);
            if (data.data.name) {
              localStorage.setItem('espb_last_admin_name', data.data.name);
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
    },
    [router, onClose, onLoginSuccess]
  );

  // Initialize GIS if Google Client ID is configured
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (isGsiLoaded && window.google?.accounts?.id && clientId) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
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
  }, [isGsiLoaded, handleCredentialResponse]);

  if (!isOpen) return null;

  // Trigger Google OAuth 2.0 Authorization Flow
  // This physically navigates to Google's official login screen.
  // Google validates user credentials/2FA and redirects back to /api/auth/google/callback.
  // No user can forge or type another person's email.
  const handleGoogleOAuthLogin = (hintEmail?: string) => {
    setIsLoading(true);
    setErrorMessage('');
    setErrorDetails(null);

    let loginUrl = '/api/auth/google/login';
    if (hintEmail) {
      loginUrl += `?login_hint=${encodeURIComponent(hintEmail)}`;
    }
    window.location.href = loginUrl;
  };

  const clearLastAccount = () => {
    try {
      localStorage.removeItem('espb_last_admin_email');
      localStorage.removeItem('espb_last_admin_name');
    } catch {}
    setLastAccount(null);
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
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
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

        {/* Alert Error Box */}
        {errorMessage && (
          <div className="mb-5 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 space-y-2">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <div className="flex-1 font-medium leading-relaxed">
                {errorMessage}
              </div>
            </div>

            {errorDetails?.code === 'oauth_not_configured' && (
              <div className="pt-2 border-t border-red-200 dark:border-red-900/40 text-[11px] text-red-600 dark:text-red-400">
                Langkah penyelesaian: Tambah nilai <code>GOOGLE_CLIENT_ID</code> dan <code>GOOGLE_CLIENT_SECRET</code> ke dalam fail <code>.env.local</code>.
              </div>
            )}
            {errorDetails?.code === 'unauthorized' && errorDetails.email && (
              <div className="pt-2 border-t border-red-200 dark:border-red-900/40 text-[11px] text-red-600 dark:text-red-400">
                E-mel yang disahkan oleh Google: <strong className="font-semibold underline">{errorDetails.email}</strong>. Sila pastikan e-mel ini wujud dalam lembaran <em>Employees</em> Google Sheets PPD Beluran dengan peranan admin.
              </div>
            )}
          </div>
        )}

        {/* Google Workspace Authentication Section */}
        <div className="space-y-4">
          {/* Last Used Account Card (if found) */}
          {lastAccount ? (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-gov-navy-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gov-gold-500/20 text-gov-gold-600 dark:text-gov-gold-400 font-extrabold text-sm flex items-center justify-center flex-shrink-0 border border-gov-gold-500/30">
                  {lastAccount.email[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Akaun Terakhir
                    </span>
                  </div>
                  <p className="font-bold text-sm text-slate-900 dark:text-white truncate mt-0.5">
                    {lastAccount.name || lastAccount.email}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {lastAccount.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleGoogleOAuthLogin(lastAccount.email)}
                  disabled={isLoading}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gov-gold-500 hover:bg-gov-gold-600 text-gov-navy-950 font-bold text-xs transition-all shadow-xs flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5" />
                  )}
                  <span>Sahkan sebagai Akaun Ini</span>
                </button>

                <button
                  type="button"
                  onClick={clearLastAccount}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs transition-colors"
                  title="Guna akaun Google lain"
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
                Log Masuk Rasmi Google Workspace KPM
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                Log masuk yang disahkan terus oleh Google menggunakan akaun rasmi KPM (@moe.gov.my). Tiada kata laluan diperlukan dan identiti dilindungi sepenuhnya.
              </p>
            </div>
          )}

          {/* Google Identity Services Render Target (If Client ID set) */}
          <div ref={googleBtnContainerRef} className="flex justify-center my-1" />

          {/* Primary OAuth 2.0 Login Action Button */}
          <button
            type="button"
            onClick={() => handleGoogleOAuthLogin()}
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-2xl bg-white dark:bg-gov-navy-900 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-gov-navy-800 border-2 border-slate-200 dark:border-slate-800 hover:border-gov-gold-500 font-bold text-sm transition-all shadow-xs flex items-center justify-center space-x-2.5 disabled:opacity-50 cursor-pointer group"
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
                ? 'Menghubungkan ke Google...'
                : lastAccount
                ? 'Log Masuk dengan Akaun Lain'
                : 'Log Masuk dengan Google Workspace'}
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-400 dark:text-slate-500 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Pengesahan Google OAuth 2.0 & OpenID Connect</span>
          </div>
        </div>
      </div>
    </div>
  );
};
