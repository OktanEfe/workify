import { createHash } from 'node:crypto';
import { z } from 'zod';
import { AccessDenied, type Actor } from '@/lib/access';
import { withActor, brandScope, audit } from './context';
import { contentInput, contentScope } from './content';
import { db } from '@/lib/db';
import { keywords, referenceUrl } from '@/lib/content-ideas';
const importInput = z
  .object({
    brandId: z.string().min(1).max(100),
    rows: z
      .array(
        contentInput
          .omit({ brandId: true, scheduledAt: true })
          .extend({ body: z.string().trim().max(3000) }),
      )
      .min(1)
      .max(100),
  })
  .strict();
export async function importContentIdeas(actor: Actor, input: unknown) {
  const data = importInput.parse(input);
  if (JSON.stringify(data).length > 450000)
    throw Error('Aktarım çok büyük. Daha küçük bir tablo seçin.');
  return withActor(
    actor,
    async (tx, fresh, name) => {
      const brand = await tx.brand.findFirst({
        where: {
          id: data.brandId,
          organizationId: fresh.organizationId,
          archived: false,
        },
      });
      if (!brand) throw new AccessDenied();
      const rows = data.rows.map((row) => ({
        ...row,
        organizationId: fresh.organizationId,
        brandId: brand.id,
        importKey: createHash('sha256')
          .update(
            JSON.stringify([
              row.title,
              row.body,
              row.channel,
              row.format,
              [...new Set(row.referenceLinks)].sort(),
            ]),
          )
          .digest('hex'),
      }));
      const result = await tx.contentItem.createMany({
        data: rows,
        skipDuplicates: true,
      });
      await audit(tx, fresh, name, {
        action: 'IMPORT',
        entity: 'ContentItem',
        entityId: brand.id,
        brandId: brand.id,
        summary: `Excel'den ${result.count} içerik fikri eklendi.`,
      });
      return {
        inserted: result.count,
        skipped: data.rows.length - result.count,
      };
    },
    true,
  );
}
export async function inspirationSource(actor: Actor, id: string) {
  const item = await db.contentItem.findFirst({
    where: {
      ...contentScope(actor),
      id,
      brand: { ...brandScope(actor), archived: false },
    },
  });
  if (!item) throw new AccessDenied();
  return item;
}
export type WebExample = { title: string; url: string; description: string };
export async function searchWebExamples(
  actor: Actor,
  id: string,
  query: string,
  inspectReferences = false,
) {
  const text = z.string().trim().min(3).max(180).parse(query);
  const item = await inspirationSource(actor, id);
  const key = process.env.TAVILY_API_KEY;
  if (!key) return { configured: false as const, results: [] as WebExample[] };
  // Reserve an organization-wide daily budget and a per-member minute slot in DB.
  await withActor(actor, async (tx, fresh) => {
    const source = await tx.contentItem.findFirst({
      where: {
        ...contentScope(fresh),
        id,
        brand: { ...brandScope(fresh), archived: false },
      },
    });
    if (!source) throw new AccessDenied();
    const now = Date.now();
    for (const [bucket, limit, window] of [
      [
        `inspiration:member:${fresh.organizationId}:${fresh.membershipId}`,
        3,
        60000,
      ],
      [`inspiration:org:${fresh.organizationId}`, 20, 86400000],
    ] as const) {
      const entry = await tx.rateLimit.findUnique({ where: { key: bucket } });
      if (
        entry &&
        Number(entry.lastRequest) > now - window &&
        entry.count >= limit
      )
        throw Error('Arama sınırına ulaşıldı. Daha sonra tekrar deneyin.');
      const reset = !entry || Number(entry.lastRequest) <= now - window;
      await tx.rateLimit.upsert({
        where: { key: bucket },
        create: {
          id: createHash('sha256').update(bucket).digest('hex'),
          key: bucket,
          count: 1,
          lastRequest: BigInt(now),
        },
        update: {
          count: reset ? 1 : { increment: 1 },
          ...(reset ? { lastRequest: BigInt(now) } : {}),
        },
      });
    }
  });
  const analysis: string[] = [];
  let sourceTerms = '';
  if (inspectReferences && item.referenceLinks.length) {
    try {
      const raw = await tavilyRequest('extract', key, {
        urls: item.referenceLinks.slice(0, 3),
        extract_depth: 'basic',
        format: 'text',
        include_images: false,
      });
      const extracted = z
        .object({
          results: z
            .array(z.object({ url: z.string(), raw_content: z.string() }))
            .max(3),
        })
        .parse(raw);
      const allowed = new Set(item.referenceLinks);
      const terms = extracted.results
        .filter((r) => allowed.has(r.url))
        .flatMap((r) => {
          const tokens = keywords(r.raw_content.slice(0, 12000)).slice(0, 6);
          analysis.push(
            `${new URL(r.url).hostname}: ${tokens.length ? tokens.join(', ') : 'Metinde konu çıkarılamadı.'}`,
          );
          return tokens;
        });
      sourceTerms = [...new Set(terms)].slice(0, 6).join(' ');
      if (!analysis.length)
        analysis.push(
          'Örnek bağlantılardan okunabilir metin alınamadı; yalnız açıklama ile arandı.',
        );
    } catch {
      analysis.push('Örnek bağlantılar okunamadı; yalnız açıklama ile arandı.');
    }
  }
  const raw = await tavilyRequest('search', key, {
    query: `${text}${sourceTerms ? ' ' + sourceTerms : ''} ${item.channel} ${item.format} içerik örnekleri`,
    search_depth: 'basic',
    max_results: 6,
    include_answer: false,
    include_raw_content: false,
    include_images: false,
  });
  const parsed = z
    .object({
      results: z
        .array(
          z.object({
            title: z.string(),
            url: z.string(),
            content: z.string().optional(),
          }),
        )
        .max(20),
    })
    .safeParse(raw);
  if (!parsed.success) throw Error('Arama yanıtı okunamadı.');
  const seen = new Set(item.referenceLinks);
  const results: WebExample[] = [];
  for (const result of parsed.data.results) {
    const url = referenceUrl.safeParse(result.url);
    if (!url.success || seen.has(url.data)) continue;
    seen.add(url.data);
    results.push({
      title: result.title.slice(0, 250),
      url: url.data,
      description: (result.content ?? '').slice(0, 750),
    });
  }
  return { configured: true as const, results: results.slice(0, 6), analysis };
}
export function suggestedSearch(item: { title: string; body: string }) {
  return (
    keywords(item.title + ' ' + item.body)
      .slice(0, 6)
      .join(' ') || item.title.slice(0, 150)
  );
}

async function tavilyRequest(
  endpoint: 'search' | 'extract',
  key: string,
  body: unknown,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch('https://api.tavily.com/' + endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
      redirect: 'error',
      cache: 'no-store',
    });
  } catch {
    throw Error('İnternet aramasına ulaşılamadı. Tekrar deneyin.');
  }
  if (!response.ok)
    throw Error(
      'Arama servisi isteği tamamlayamadı. Kota veya bağlantı ayarlarını kontrol edin.',
    );
  const reader = response.body?.getReader();
  if (!reader) throw Error('Arama yanıtı alınamadı.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 256000) {
      await reader.cancel();
      throw Error('Arama yanıtı çok büyük.');
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } catch {
    throw Error('Arama yanıtı okunamadı.');
  }
}
