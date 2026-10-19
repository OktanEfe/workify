import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { statuses } from '@/lib/labels';
import { db } from '@/lib/db';
import {
  assertOrganization,
  assertTaskAccess,
  AccessDenied,
  type Actor,
} from '@/lib/access';
export const statusInput = z
  .object({
    id: z.string().min(1),
    version: z.number().int().nonnegative(),
    position: z.number().int().min(0).max(2000000000).optional(),
    status: z.enum([
      'BACKLOG',
      'TODO',
      'IN_PROGRESS',
      'IN_REVIEW',
      'REVISION',
      'COMPLETED',
      'CANCELLED',
    ]),
  })
  .strict();
export async function listTasks(actor: Actor, page = 1) {
  assertOrganization(actor, actor.organizationId);
  const safePage = z.number().int().min(1).max(10000).parse(page);
  return db.task.findMany({
    where: {
      organizationId: actor.organizationId,
      deletedAt: null,
      ...(actor.role === 'EMPLOYEE'
        ? {
            brand: {
              archived: false,
              members: { some: { membershipId: actor.membershipId } },
            },
            assignments: { some: { membershipId: actor.membershipId } },
          }
        : {}),
    },
    orderBy: [{ position: 'asc' }, { id: 'asc' }],
    skip: (safePage - 1) * 30,
    take: 30,
    include: { brand: { select: { name: true } } },
  });
}
export async function updateTaskStatus(actor: Actor, input: unknown) {
  const data = statusInput.parse(input);
  return db.$transaction(
    async (tx) => {
      // Re-read membership inside the transaction; never accept roles from a request.
      const member = await tx.membership.findUnique({
        where: { id: actor.membershipId },
        include: { user: { select: { name: true } } },
      });
      if (
        !member ||
        !member.active ||
        member.userId !== actor.userId ||
        member.organizationId !== actor.organizationId
      )
        throw new AccessDenied();
      const fresh = { ...actor, role: member.role, active: member.active };
      const task = await tx.task.findFirst({
        where: {
          id: data.id,
          organizationId: fresh.organizationId,
          deletedAt: null,
        },
        include: { assignments: true, brand: { include: { members: true } } },
      });
      if (!task) throw new AccessDenied();
      if (fresh.role === 'EMPLOYEE' && task.brand.archived)
        throw new AccessDenied();
      assertTaskAccess(fresh, {
        organizationId: task.organizationId,
        brandMemberIds: task.brand.members.map((m) => m.membershipId),
        assigneeIds: task.assignments.map((a) => a.membershipId),
      });
      const result = await tx.task.updateMany({
        where: {
          id: task.id,
          organizationId: fresh.organizationId,
          version: data.version,
        },
        data: {
          status: data.status,
          completedAt:
            data.status === 'COMPLETED'
              ? (task.completedAt ?? new Date())
              : null,
          ...(data.position !== undefined ? { position: data.position } : {}),
          version: { increment: 1 },
        },
      });
      if (result.count !== 1)
        throw new Error('Görev değişti. Sayfayı yenileyip tekrar deneyin.');
      await tx.auditLog.create({
        data: {
          organizationId: fresh.organizationId,
          actorId: fresh.userId,
          actorName: member.user?.name ?? 'Ekip üyesi',
          action: 'STATUS_CHANGE',
          entity: 'Task',
          entityId: task.id,
          brandId: task.brandId,
          summary: `${task.title} görev durumu ${statuses[data.status]} olarak güncellendi.`,
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
