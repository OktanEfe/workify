import { describe, it, expect } from 'vitest';
import { calendarMonth } from '../src/lib/calendar';
describe('İstanbul aylık takvim', () => {
  it('ay sınırlarını İstanbul gece yarısından hesaplar', () => {
    const m = calendarMonth('2026-10');
    expect(m.start.toISOString()).toBe('2026-09-30T21:00:00.000Z');
    expect(m.end.toISOString()).toBe('2026-10-31T21:00:00.000Z');
    expect(m.cells.filter(Boolean)).toHaveLength(31);
    expect(m.cells[3]).toBe('2026-10-01');
  });
  it('artık yıl ve yıl geçişini destekler', () => {
    expect(calendarMonth('2028-02').cells.filter(Boolean)).toHaveLength(29);
    expect(calendarMonth('2026-12').next).toBe('2027-01');
    expect(calendarMonth('2026-01').previous).toBe('2025-12');
  });
  it('bozuk ayı güvenli biçimde mevcut aya çevirir', () => {
    expect(calendarMonth('2026-99', new Date('2026-10-18T22:00:00Z')).key).toBe(
      '2026-10',
    );
  });
});
