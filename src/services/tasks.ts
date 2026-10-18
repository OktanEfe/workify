import { z } from 'zod';
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
    status: z.enum([
      'BACKLOG',
      'TODO',
      'IN_PROGRESS',
      'IN_REVIEW',
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
      ...(actor.role === 'EMPLOYEE'
        ? {
            brand: { members: { some: { membershipId: actor.membershipId } } },
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
  return db.$transaction(async (tx) => {
    // Re-read membership inside the transaction; never accept roles from a request.
    const member = await tx.membership.findUnique({
      where: { id: actor.membershipId },
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
      where: { id: data.id, organizationId: fresh.organizationId },
      include: { assignments: true, brand: { include: { members: true } } },
    });
    if (!task) throw new AccessDenied();
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
      data: { status: data.status, version: { increment: 1 } },
    });
    if (result.count !== 1)
      throw new Error('Görev değişti. Sayfayı yenileyip tekrar deneyin.');
  });
}
