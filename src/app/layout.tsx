import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'E-SPb PPDB — Sektor Pembelajaran PPD Beluran',
  description: 'Portal Rasmi Sektor Pembelajaran Pejabat Pendidikan Daerah Beluran, Sabah. Mengurus kurikulum, bimbingan pedagogi SISC+, dan repositori dokumen unit.',
  keywords: ['E-SPb', 'PPD Beluran', 'Sektor Pembelajaran', 'SISC+', 'Sabah', 'KPM', 'Pendidikan'],
  authors: [{ name: 'Sektor Pembelajaran PPD Beluran' }],
  referrer: 'no-referrer',
  icons: {
    icon: '/api/images/1uM0wo3a7aAZKBZn6RHkFjF8PtyXwGSQL',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ms" className="dark" suppressHydrationWarning>
      <head>
        <meta name="referrer" content="no-referrer" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('espb_theme');
                if (theme === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased selection:bg-gov-gold-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
