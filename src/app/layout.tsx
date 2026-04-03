import type { Metadata } from 'next';
import { Inter, Merriweather } from 'next/font/google';
import './globals.css';
import UserProvider from '@/components/providers/UserProvider';
import LayoutWrapper from '@/components/LayoutWrapper';
import { Toaster } from 'sonner';

const InterSans = Inter({
  variable: '--font-inter-sans',
  subsets: ['latin'],
});

const MerriweatherFont = Merriweather({
  weight: ['300', '400', '700', '900'],
  variable: '--font-merriweather',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'NIIIFTY',
  description: 'NIIIFTY File Hosting',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <div className={`${InterSans.variable} ${MerriweatherFont.variable} min-h-screen font-sans`}>
          <UserProvider>
            <LayoutWrapper>
              {children}
              <Toaster closeButton position="top-right" richColors />
            </LayoutWrapper>
          </UserProvider>
        </div>
      </body>
    </html>
  );
}
