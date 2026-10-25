'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
const names = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];
export function MonthNavigation({
  month,
  previous,
  next,
  brand,
  basePath = '/workspace/calendar',
  filters = {},
}: {
  month: string;
  previous: string;
  next: string;
  brand?: string;
  basePath?: string;
  filters?: Record<string, string>;
}) {
  const router = useRouter();
  const [year, current] = month.split('-');
  const href = (value: string) =>
    basePath +
    '?' +
    new URLSearchParams({
      ...filters,
      month: value,
      ...(brand ? { brand } : {}),
    });
  return (
    <div className="month-navigation">
      <Link href={href(previous)} aria-label="Önceki ay">
        ← Önceki ay
      </Link>
      <div className="month-selectors">
        <label>
          Ay
          <select
            aria-label="Takvim ayı"
            value={current}
            onChange={(e) => router.push(href(year + '-' + e.target.value))}
          >
            {names.map((name, i) => (
              <option key={name} value={String(i + 1).padStart(2, '0')}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Yıl
          <select
            aria-label="Takvim yılı"
            value={year}
            onChange={(e) => router.push(href(e.target.value + '-' + current))}
          >
            {Array.from({ length: 21 }, (_, i) => Number(year) - 10 + i)
              .filter((y) => y >= 1900 && y <= 2199)
              .map((y) => (
                <option key={y}>{y}</option>
              ))}
          </select>
        </label>
      </div>
      <Link href={href(next)} aria-label="Sonraki ay">
        Sonraki ay →
      </Link>
      <Link
        href={
          basePath +
          '?' +
          new URLSearchParams({ ...filters, ...(brand ? { brand } : {}) })
        }
        className="subtle-button"
      >
        Bugüne dön
      </Link>
    </div>
  );
}
