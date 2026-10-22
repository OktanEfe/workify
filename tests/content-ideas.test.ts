import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { readSheet } from 'read-excel-file/node';
import {
  parseIdeaRows,
  splitReferences,
  relatedExamples,
  keywords,
  validateWorkbookZip,
  productionIdeas,
} from '../src/lib/content-ideas';
const base = {
  id: 'a',
  brandId: 'brand',
  title: 'Kahve demleme teknikleri',
  body: 'Evde kahve öğütme ve demleme',
  channel: 'Instagram',
  format: 'Reels',
  referenceLinks: [],
};
describe('İçerik fikirleri ve Excel doğrulama', () => {
  it('gerçek XLSX dosyasını kütüphane üzerinden okuyup fikir satırına dönüştürür', async () => {
    const file = await readFile(
      new URL('./fixtures/content-ideas.xlsx', import.meta.url),
    );
    validateWorkbookZip(file);
    const rows = await readSheet(file, 1);
    expect(parseIdeaRows(rows)[0]).toMatchObject({
      title: 'Excel test fikri',
      format: 'Reels',
      referenceLinks: ['https://example.com/reference'],
    });
  });
  it('Türkçe başlıkları eşler, boş kanal/format varsayılanı ve linkleri okur', () => {
    expect(
      parseIdeaRows([
        ['Başlık', 'Açıklama', 'Kanal', 'Format', 'Örnek linkler'],
        [
          'Kahve',
          'İlk sahne',
          '',
          '',
          'https://example.com/a;https://example.com/b',
        ],
      ]),
    ).toEqual([
      {
        title: 'Kahve',
        body: 'İlk sahne',
        channel: 'Instagram',
        format: 'Gönderi',
        referenceLinks: ['https://example.com/a', 'https://example.com/b'],
      },
    ]);
  });
  it('geçersiz veya fazla satırın tamamını reddeder', () => {
    expect(() => parseIdeaRows([['Yanlış'], ['A']])).toThrow('Başlık');
    expect(() =>
      parseIdeaRows([
        ['Başlık', 'Kanal'],
        ['A', 'Geçersiz'],
      ]),
    ).toThrow('2. satırı');
    expect(() =>
      parseIdeaRows([
        ['Başlık'],
        ...Array.from({ length: 101 }, () => ['Fikir']),
      ]),
    ).toThrow('100');
    expect(() => parseIdeaRows([['Başlık'], ['']])).toThrow('bulunamadı');
  });
  it('javascript, yerel bağlantı, kimlik bilgili URL ve 10 üzeri linki reddeder', () => {
    for (const value of [
      'javascript:alert(1)',
      'http://example.com',
      'https://localhost/a',
      'https://127.0.0.1/a',
      'https://name:password@example.com',
    ])
      expect(() => splitReferences(value)).toThrow();
    expect(() =>
      splitReferences(Array(11).fill('https://example.com').join('\n')),
    ).toThrow();
  });
  it('kurum içi farklı markayı ve kendisini önermez, konu benzerliğini öne alır', () => {
    const related = {
      ...base,
      id: 'b',
      referenceLinks: ['https://example.com/coffee'],
    };
    const other = { ...related, id: 'c', brandId: 'another' };
    expect(
      relatedExamples(base, [base, related, other]).map((r) => r.id),
    ).toEqual(['b']);
    expect(relatedExamples(base, [related])[0].reason).toContain('kahve');
    expect(
      keywords('Kahve ve https://private.example.com/secret için kahve'),
    ).toEqual(['kahve']);
  });
  it('üretim taslağında ilk sahne, akış ve kapanış bulunur', () => {
    const ideas = productionIdeas(base);
    expect(ideas).toHaveLength(3);
    expect(ideas.every((i) => i.hook && i.flow && i.cta)).toBe(true);
  });
  it('bozuk ve büyük Excel arşivini açmadan reddeder', () => {
    expect(() => validateWorkbookZip(new Uint8Array(40))).toThrow();
    expect(() => validateWorkbookZip(new Uint8Array(2097153))).toThrow('2 MB');
  });
});
