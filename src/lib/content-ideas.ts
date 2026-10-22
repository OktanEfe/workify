import { z } from 'zod';
export const referenceUrl = z
  .string()
  .trim()
  .max(2000)
  .transform((value, ctx) => {
    try {
      const url = new URL(value);
      if (
        url.protocol !== 'https:' ||
        url.username ||
        url.password ||
        !url.hostname.includes('.') ||
        /(^localhost$|\.local$|\.internal$|^[\d.:]+$)/i.test(url.hostname)
      )
        throw Error();
      url.hash = '';
      return url.href;
    } catch {
      ctx.addIssue({
        code: 'custom',
        message:
          'Örnek bağlantıları geçerli, herkese açık HTTPS adresleri olmalı.',
      });
      return z.NEVER;
    }
  });
export const referenceLinks = z.array(referenceUrl).max(10).default([]);
export function splitReferences(value: string) {
  return referenceLinks.parse(
    value
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean),
  );
}
const stop = new Set(
  'bir bu ve ile için nasıl daha çok yeni gibi olan olarak içerik örnek örneği fikir fikri video reels story gönderi instagram tiktok youtube linkedin facebook web the and of to in is'.split(
    ' ',
  ),
);
export function keywords(text: string) {
  return [
    ...new Set(
      text
        .replace(/https?:\/\/\S+/g, ' ')
        .toLocaleLowerCase('tr-TR')
        .match(/[\p{L}\p{N}]{3,}/gu) ?? [],
    ),
  ]
    .filter((t) => !stop.has(t))
    .slice(0, 16);
}
export type Idea = {
  id: string;
  brandId: string;
  title: string;
  body: string;
  channel: string;
  format: string;
  referenceLinks: string[];
};
export function relatedExamples(source: Idea, candidates: Idea[]) {
  const tokens = keywords(source.title + ' ' + source.body);
  return candidates
    .filter(
      (c) =>
        c.id !== source.id &&
        c.brandId === source.brandId &&
        c.referenceLinks.some((url) => !source.referenceLinks.includes(url)),
    )
    .map((c) => {
      const other = keywords(c.title + ' ' + c.body);
      const common = tokens.filter((t) => other.includes(t));
      const sameFormat = c.format === source.format;
      const sameChannel = c.channel === source.channel;
      return {
        ...c,
        score: common.length * 3 + Number(sameFormat) + Number(sameChannel),
        reason: [
          common.length ? 'Ortak konu: ' + common.slice(0, 3).join(', ') : '',
          sameFormat ? 'Aynı format: ' + c.format : '',
          sameChannel ? 'Aynı kanal: ' + c.channel : '',
        ]
          .filter(Boolean)
          .join(' · '),
      };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, 4);
}
export function productionIdeas(
  source: Pick<Idea, 'title' | 'format' | 'channel' | 'body'>,
) {
  const topic = source.title;
  return [
    {
      title: 'Sorundan çözüme',
      hook: `“${topic} konusunda en sık yapılan hata ne?” sorusuyla açın.`,
      flow: 'Sorunu tek örnekte gösterin; uygulanabilir üç adım verin; sonucu önce/sonra ile karşılaştırın.',
      cta: 'İzleyiciden kendi deneyimini yorumlarda paylaşmasını isteyin.',
    },
    {
      title: 'Perde arkasına davet',
      hook: 'Sonucu ilk karede gösterin ve “Bunu nasıl yaptık?” diye sorun.',
      flow: `Hazırlık, üretim ve sonuç aşamalarını kısa sahnelerle anlatın. ${source.format} formatına uygun tek ana mesaj seçin.`,
      cta: '“Sıradaki içerikte hangi aşamayı anlatalım?” sorusuyla bitirin.',
    },
    {
      title: 'Kaydedilecek mini rehber',
      hook: `${topic} için hızlı bir kontrol listesi vaat edin.`,
      flow: 'Her bölümde tek öneri verin. Açıklamada gereken malzemeleri veya adımları listeleyin; iddiaları doğrulayın.',
      cta: 'Sonraki kullanım için kaydetmeye davet edin.',
    },
  ];
}
export type ImportedIdea = {
  title: string;
  body: string;
  channel: string;
  format: string;
  referenceLinks: string[];
};
function header(value: string) {
  return value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .trim();
}
export function parseIdeaRows(rows: unknown[][]): ImportedIdea[] {
  if (!rows.length || rows.length > 101)
    throw Error('İlk sayfada başlık satırı ve en fazla 100 fikir olmalı.');
  const headers = rows[0].map((v) => header(String(v ?? '')));
  const find = (...names: string[]) =>
    headers.findIndex((h) => names.includes(h));
  const title = find('baslik', 'icerik basligi', 'fikir', 'title');
  const body = find('aciklama', 'not', 'metin', 'body');
  const channel = find('kanal', 'channel');
  const format = find('format');
  const links = find('ornek linkler', 'ornek link', 'link', 'links');
  if (title < 0)
    throw Error(
      'Başlık sütunu bulunamadı. İlk satıra Başlık, Açıklama, Kanal, Format, Örnek linkler yazın.',
    );
  const output: ImportedIdea[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.every((v) => v === null || v === undefined || v === '')) continue;
    const cell = (index: number) =>
      index < 0 ? '' : String(row[index] ?? '').trim();
    try {
      const c = cell(channel) || 'Instagram',
        f = cell(format) || 'Gönderi';
      output.push(
        z
          .object({
            title: z.string().min(1).max(200),
            body: z.string().max(3000),
            channel: z.enum([
              'Instagram',
              'TikTok',
              'LinkedIn',
              'YouTube',
              'Facebook',
              'Web',
            ]),
            format: z.enum(['Gönderi', 'Reels', 'Story', 'Video', 'Yazı']),
            referenceLinks,
          })
          .parse({
            title: cell(title),
            body: cell(body),
            channel: c,
            format: f,
            referenceLinks: cell(links)
              .split(/[\n;]/)
              .map((s) => s.trim())
              .filter(Boolean),
          }),
      );
    } catch {
      throw Error(
        `${i + 1}. satırı kontrol edin: başlık, kanal, format veya HTTPS örnek linki geçersiz.`,
      );
    }
  }
  if (!output.length) throw Error('Aktarılacak fikir bulunamadı.');
  return output;
}
// Inspect ZIP directory before decompression, bounding XLSX work and rejecting macros.
export function validateWorkbookZip(bytes: Uint8Array) {
  if (bytes.length > 2 * 1024 * 1024)
    throw Error('Excel dosyası en fazla 2 MB olabilir.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let p = bytes.length - 22; p >= Math.max(0, bytes.length - 65557); p--)
    if (view.getUint32(p, true) === 0x06054b50) {
      end = p;
      break;
    }
  if (end < 0) throw Error('Geçerli bir .xlsx dosyası seçin.');
  const count = view.getUint16(end + 10, true);
  let pos = view.getUint32(end + 16, true),
    total = 0;
  if (count > 200 || count === 0)
    throw Error('Çalışma kitabı çok karmaşık. Sade bir .xlsx kullanın.');
  for (let i = 0; i < count; i++) {
    if (pos + 46 > bytes.length || view.getUint32(pos, true) !== 0x02014b50)
      throw Error('Excel dosyası okunamadı.');
    total += view.getUint32(pos + 24, true);
    const nameLength = view.getUint16(pos + 28, true),
      extra = view.getUint16(pos + 30, true),
      comment = view.getUint16(pos + 32, true);
    const filename = new TextDecoder().decode(
      bytes.slice(pos + 46, pos + 46 + nameLength),
    );
    if (
      total > 12 * 1024 * 1024 ||
      /vbaProject|externalLinks|\.bin$/i.test(filename)
    )
      throw Error(
        'Makro, dış bağlantı veya çok büyük çalışma kitabı desteklenmiyor.',
      );
    pos += 46 + nameLength + extra + comment;
  }
}
