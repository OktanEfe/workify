import { localStamp, parseLocal } from './dates';
export function calendarMonth(value?: string, now = new Date()) {
  const fallback = localStamp(now).slice(0, 7);
  const key =
    value && /^(20[0-9]{2})-(0[1-9]|1[0-2])$/.test(value) ? value : fallback;
  const [year, month] = key.split('-').map(Number);
  const first = new Date(Date.UTC(year, month - 1, 1));
  const next = new Date(Date.UTC(year, month, 1));
  const start = parseLocal(key + '-01T00:00')!;
  const nextKey = next.toISOString().slice(0, 7);
  const previous = new Date(Date.UTC(year, month - 2, 1))
    .toISOString()
    .slice(0, 7);
  const offset = (first.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells = Array.from(
    { length: Math.ceil((offset + days) / 7) * 7 },
    (_, i) => {
      const day = i - offset + 1;
      return day < 1 || day > days
        ? null
        : `${key}-${String(day).padStart(2, '0')}`;
    },
  );
  return {
    key,
    start,
    end: parseLocal(nextKey + '-01T00:00')!,
    previous,
    next: nextKey,
    cells,
    label: new Intl.DateTimeFormat('tr-TR', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(first),
  };
}
