export const TIME_ZONE = 'Europe/Istanbul';
export function localStamp(date: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
export function parseLocal(value: string): Date | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))
    throw new Error('Tarih ve saat geçersiz.');
  const guess = new Date(value + 'Z');
  if (!Number.isFinite(guess.getTime())) throw new Error('Tarih geçersiz.');
  const offset = new Date(localStamp(guess) + 'Z').getTime() - guess.getTime();
  const result = new Date(guess.getTime() - offset);
  if (localStamp(result) !== value) throw new Error('Tarih geçersiz.');
  return result;
}
export function dayWindow(now = new Date()) {
  const start = parseLocal(localStamp(now).slice(0, 10) + 'T00:00')!;
  return { start, end: new Date(start.getTime() + 86400000) };
}
export function displayDate(date: Date | null | undefined) {
  return date
    ? new Intl.DateTimeFormat('tr-TR', {
        timeZone: TIME_ZONE,
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
    : 'Belirlenmedi';
}
export function nextOccurrence(date: Date, recurrence: string) {
  const local = new Date(localStamp(date) + 'Z');
  if (recurrence === 'DAILY') local.setUTCDate(local.getUTCDate() + 1);
  else if (recurrence === 'WEEKLY') local.setUTCDate(local.getUTCDate() + 7);
  else if (recurrence === 'MONTHLY') {
    const day = local.getUTCDate();
    local.setUTCDate(1);
    local.setUTCMonth(local.getUTCMonth() + 1);
    const last = new Date(
      Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + 1, 0),
    ).getUTCDate();
    local.setUTCDate(Math.min(day, last));
  } else throw new Error('Tekrarlama geçersiz.');
  return parseLocal(local.toISOString().slice(0, 16))!;
}
