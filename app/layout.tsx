import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; 
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter', 
});

export const metadata: Metadata = {
  title: 'Workify | Akıllı Çalışma Alanı',
  description: 'Developerlar ve öğrenciler için Apple tarzı, yapay zeka destekli yeni nesil çalışma alanı.',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={`${inter.variable}`}>
      <body className={`
        ${inter.className} 
        antialiased 
        bg-white 
        text-[#1d1d1f] 
        selection:bg-[#007AFF] selection:text-white
      `}>
        <Navbar />
        
        
        <main className="min-h-screen">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}