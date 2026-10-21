import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { AccessDenied, assertOrganization, type Actor } from '@/lib/access';
export type Tx = Prisma.TransactionClient;
export async function withActor<T>(
  actor: Actor,
  run: (tx: Tx, fresh: Actor, name: string) => Promise<T>,
  admin = false,
): Promise<T> {
  return db.$transaction(
    async (tx) => {
      const member = await tx.membership.findFirst({
        where: {
          id: actor.membershipId,
          userId: actor.userId,
          organizationId: actor.organizationId,
          active: true,
        },
        include: { user: { select: { name: true } } },
      });
      if (!member || (admin && member.role !== 'ADMIN'))
        throw new AccessDenied();
      return run(
        tx,
        { ...actor, role: member.role, active: true },
        member.user.name,
      );
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
export function taskScope(actor: Actor): Prisma.TaskWhereInput {
  assertOrganization(actor, actor.organizationId);
  return {
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
  };
}
// A personal calendar never inherits an administrator's organization-wide view.
export function personalTaskScope(actor: Actor): Prisma.TaskWhereInput {
  return {
    AND: [
      taskScope(actor),
      {
        assignments: { some: { membershipId: actor.membershipId } },
      },
    ],
  };
}
export function brandScope(actor: Actor): Prisma.BrandWhereInput {
  assertOrganization(actor, actor.organizationId);
  return {
    organizationId: actor.organizationId,
    ...(actor.role === 'EMPLOYEE'
      ? {
          archived: false,
          members: { some: { membershipId: actor.membershipId } },
        }
      : {}),
  };
}
export async function audit(
  tx: Tx,
  actor: Actor,
  name: string,
  data: {
    action: string;
    entity: string;
    entityId: string;
    summary: string;
    brandId?: string;
  },
) {
  await tx.auditLog.create({
    data: {
      organizationId: actor.organizationId,
      actorId: actor.userId,
      actorName: name,
      ...data,
    },
  });
}
export async function findTask(tx: Tx, actor: Actor, id: string) {
  const task = await tx.task.findFirst({
    where: { ...taskScope(actor), id },
    include: { assignments: true, brand: true },
  });
  if (!task) throw new AccessDenied();
  return task;
}
