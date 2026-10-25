import type { Metadata } from 'next';
import './globals.css';
import './workspace-refresh.css';
import './planning.css';
export const metadata: Metadata = {
  title: 'Avrasia · Ajans çalışma alanı',
  description: 'Avrasia Creative ekip çalışma alanı',
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
