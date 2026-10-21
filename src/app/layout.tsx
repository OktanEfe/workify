import type { Metadata } from 'next';
import './globals.css';
import './workspace-refresh.css';
export const metadata: Metadata = {
  title: 'Workify · Ajans çalışma alanı',
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
