import { z } from 'zod';
import { AccessDenied, type Actor } from '@/lib/access';
import { withActor, brandScope, audit } from './context';
import { referenceLinks } from '@/lib/content-ideas';
export const channels = [
  'Instagram',
  'TikTok',
  'LinkedIn',
  'YouTube',
  'Facebook',
  'Web',
] as const;
export async function brandPublications(
  actor: Actor,
  start: Date,
  end: Date,
  filters: { brand?: string; channel?: string } = {},
) {
  z.date().parse(start);
  z.date().parse(end);
  if (end <= start || end.getTime() - start.getTime() > 35 * 86400000)
    throw new Error('Takvim aralığı geçersiz.');
  return withActor(actor, async (tx, fresh) => {
    const channel = z.enum(channels).safeParse(filters.channel);
    const where = {
      organizationId: fresh.organizationId,
      brand: { ...brandScope(fresh), archived: false },
      ...(filters.brand ? { brandId: filters.brand } : {}),
      ...(channel.success ? { channel: channel.data } : {}),
    };
    const [items, unscheduled, unscheduledCount] = await Promise.all([
      tx.contentItem.findMany({
        where: { ...where, scheduledAt: { gte: start, lt: end } },
        include: { brand: { select: { name: true } } },
        orderBy: [{ scheduledAt: 'asc' }, { id: 'asc' }],
        take: 500,
      }),
      tx.contentItem.findMany({
        where: { ...where, scheduledAt: null },
        include: { brand: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 12,
      }),
      tx.contentItem.count({ where: { ...where, scheduledAt: null } }),
    ]);
    return { items, unscheduled, unscheduledCount };
  });
}
export const brandIdentityInput = z
  .object({
    brandIdentity: z.string().trim().max(5000).default(''),
    targetAudience: z.string().trim().max(3000).default(''),
    toneOfVoice: z.string().trim().max(3000).default(''),
    visualDirection: z.string().trim().max(5000).default(''),
    designPlan: z.string().trim().max(8000).default(''),
    palette: z.string().trim().max(300).default(''),
    typography: z.string().trim().max(300).default(''),
    assetLinks: referenceLinks,
  })
  .strict();
export async function brandCreativeBrief(actor: Actor, id: string) {
  return withActor(actor, async (tx, fresh) => {
    const brand = await tx.brand.findFirst({
      where: { ...brandScope(fresh), id, archived: false },
    });
    if (!brand) throw new AccessDenied();
    return brand;
  });
}
export async function saveBrandIdentity(
  actor: Actor,
  id: string,
  version: number,
  input: unknown,
) {
  const data = brandIdentityInput.parse(input);
  z.number().int().nonnegative().parse(version);
  return withActor(actor, async (tx, fresh, name) => {
    const brand = await tx.brand.findFirst({
      where: { ...brandScope(fresh), id, archived: false },
    });
    if (!brand) throw new AccessDenied();
    const changed = await tx.brand.updateMany({
      where: { id, organizationId: fresh.organizationId, version },
      data: { ...data, version: { increment: 1 } },
    });
    if (changed.count !== 1)
      throw new Error('Marka değişti veya erişilemiyor. Sayfayı yenileyin.');
    await audit(tx, fresh, name, {
      action: 'UPDATE',
      entity: 'Brand',
      entityId: id,
      brandId: id,
      summary: `${brand.name} marka kimliği ve tasarım planı güncellendi.`,
    });
  });
}
