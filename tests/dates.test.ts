import { describe, it, expect } from 'vitest';
import {
  parseLocal,
  localStamp,
  dayWindow,
  nextOccurrence,
} from '../src/lib/dates';
describe('İstanbul saatleri', () => {
  it('yerel gece yarısını UTC gün sınırından doğru geçirir', () =>
    expect(parseLocal('2026-10-19T00:15')?.toISOString()).toBe(
      '2026-10-18T21:15:00.000Z',
    ));
  it('UTC tarihini İstanbul saatine çevirir', () =>
    expect(localStamp(new Date('2026-10-18T21:15:00Z'))).toBe(
      '2026-10-19T00:15',
    ));
  it('gün penceresi İstanbul gece yarısında başlar', () =>
    expect(
      dayWindow(new Date('2026-10-18T22:00:00Z')).start.toISOString(),
    ).toBe('2026-10-18T21:00:00.000Z'));
  it.each([
    '2026-02-30T12:00',
    '2026-10-19T24:00',
    'bozuk',
    '2026-13-01T10:00',
  ])('geçersiz tarihi reddeder: %s', (value) =>
    expect(() => parseLocal(value)).toThrow(),
  );
  it('aylık tekrarı ay sonuna sınırlar', () =>
    expect(
      localStamp(nextOccurrence(parseLocal('2027-01-31T14:30')!, 'MONTHLY')),
    ).toBe('2027-02-28T14:30'));
  it('artık yılda şubatın 29 gününü kullanır', () =>
    expect(
      localStamp(nextOccurrence(parseLocal('2028-01-31T14:30')!, 'MONTHLY')),
    ).toBe('2028-02-29T14:30'));
  it('haftalık tekrarda yerel saat değişmez', () =>
    expect(
      localStamp(nextOccurrence(parseLocal('2026-10-19T09:00')!, 'WEEKLY')),
    ).toBe('2026-10-26T09:00'));
});
