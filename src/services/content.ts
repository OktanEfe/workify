import { z } from 'zod';
import { db } from '@/lib/db';
import { AccessDenied, type Actor } from '@/lib/access';
import { withActor, audit, brandScope } from './context';
import { parseLocal } from '@/lib/dates';
export const contentStatuses = {
  DRAFT: 'Taslak',
  IN_REVIEW: 'İncelemede',
  REVISION: 'Revize',
  APPROVED: 'Onaylandı',
  SCHEDULED: 'Planlandı',
  PUBLISHED: 'Yayınlandı',
} as const;
export const contentInput = z.object({
  title: z.string().trim().min(1).max(200),
  brandId: z.string().min(1).max(100),
  channel: z.enum([
    'Instagram',
    'TikTok',
    'LinkedIn',
    'YouTube',
    'Facebook',
    'Web',
  ]),
  format: z.enum(['Gönderi', 'Reels', 'Story', 'Video', 'Yazı']),
  body: z.string().trim().max(10000).default(''),
  scheduledAt: z.string().default(''),
});
export async function createContent(actor: Actor, input: unknown) {
  const data = contentInput.parse(input);
  const scheduledAt = parseLocal(data.scheduledAt);
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
      const item = await tx.contentItem.create({
        data: { ...data, scheduledAt, organizationId: fresh.organizationId },
      });
      await audit(tx, fresh, name, {
        action: 'CREATE',
        entity: 'ContentItem',
        entityId: item.id,
        brandId: item.brandId,
        summary: `${item.title} içerik planına eklendi.`,
      });
      return item.id;
    },
    true,
  );
}
export async function changeContentStatus(
  actor: Actor,
  id: string,
  version: number,
  input: string,
) {
  const status = z
    .enum([
      'DRAFT',
      'IN_REVIEW',
      'REVISION',
      'APPROVED',
      'SCHEDULED',
      'PUBLISHED',
    ])
    .parse(input);
  z.number().int().nonnegative().parse(version);
  return withActor(
    actor,
    async (tx, fresh, name) => {
      const item = await tx.contentItem.findFirst({
        where: {
          id,
          organizationId: fresh.organizationId,
          brand: { archived: false },
        },
      });
      if (!item) throw new AccessDenied();
      if (status === 'SCHEDULED' && !item.scheduledAt)
        throw new Error('Planlamak için önce yayın tarihi girin.');
      if (
        status === 'PUBLISHED' &&
        !['APPROVED', 'SCHEDULED', 'PUBLISHED'].includes(item.status)
      )
        throw new Error(
          'Yayınlandı olarak işaretlemeden önce içeriği onaylayın.',
        );
      const result = await tx.contentItem.updateMany({
        where: { id, organizationId: fresh.organizationId, version },
        data: {
          status,
          publishedAt:
            status === 'PUBLISHED' ? (item.publishedAt ?? new Date()) : null,
          version: { increment: 1 },
        },
      });
      if (result.count !== 1)
        throw new Error('İçerik değişti. Sayfayı yenileyin.');
      await audit(tx, fresh, name, {
        action: 'STATUS_CHANGE',
        entity: 'ContentItem',
        entityId: id,
        brandId: item.brandId,
        summary: `${item.title}: ${contentStatuses[status]}.`,
      });
    },
    true,
  );
}
export function contentScope(actor: Actor) {
  return { organizationId: actor.organizationId, brand: brandScope(actor) };
}
export async function listContent(
  actor: Actor,
  filters: { brand?: string; status?: string; q?: string } = {},
) {
  const status = z
    .enum([
      'DRAFT',
      'IN_REVIEW',
      'REVISION',
      'APPROVED',
      'SCHEDULED',
      'PUBLISHED',
    ])
    .optional()
    .parse(filters.status || undefined);
  return db.contentItem.findMany({
    where: {
      ...contentScope(actor),
      ...(filters.brand ? { brandId: filters.brand } : {}),
      ...(status ? { status } : {}),
      ...(filters.q
        ? {
            title: {
              contains: filters.q.slice(0, 100),
              mode: 'insensitive' as const,
            },
          }
        : {}),
    },
    include: { brand: true },
    orderBy: [{ createdAt: 'desc' }],
    take: 100,
  });
}

export async function editContent(
  actor: Actor,
  id: string,
  version: number,
  input: unknown,
) {
  const data = contentInput.parse(input);
  const scheduledAt = parseLocal(data.scheduledAt);
  z.number().int().nonnegative().parse(version);
  return withActor(
    actor,
    async (tx, fresh, name) => {
      const item = await tx.contentItem.findFirst({
        where: {
          id,
          organizationId: fresh.organizationId,
          brandId: data.brandId,
          brand: { archived: false },
        },
      });
      if (!item) throw new AccessDenied();
      if (item.status === 'PUBLISHED')
        throw new Error(
          'Yayınlanan içeriği düzenlemek için önce taslağa alın.',
        );
      const result = await tx.contentItem.updateMany({
        where: { id, organizationId: fresh.organizationId, version },
        data: {
          ...data,
          scheduledAt,
          status: 'DRAFT',
          publishedAt: null,
          version: { increment: 1 },
        },
      });
      if (result.count !== 1)
        throw new Error('İçerik değişti. Sayfayı yenileyin.');
      await audit(tx, fresh, name, {
        action: 'UPDATE',
        entity: 'ContentItem',
        entityId: id,
        brandId: item.brandId,
        summary: `${data.title} düzenlendi ve taslağa alındı.`,
      });
    },
    true,
  );
}
