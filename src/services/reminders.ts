import { db } from '@/lib/db';
import { nextOccurrence } from '@/lib/dates';
import { Prisma } from '@prisma/client';
export async function runReminderBatch(
  now = new Date(),
  scope?: { organizationId: string; membershipId: string },
) {
  const due = await db.personalTodo.findMany({
    where: {
      ...scope,
      archived: false,
      completed: false,
      remindAt: { lte: now },
      remindedAt: null,
      membership: { active: true, role: 'ADMIN' },
    },
    take: 100,
    orderBy: { remindAt: 'asc' },
  });
  for (const todo of due) {
    await db.$transaction(async (tx) => {
      await tx.notification.upsert({
        where: { dedupeKey: `todo:${todo.id}:${todo.remindAt!.toISOString()}` },
        create: {
          organizationId: todo.organizationId,
          membershipId: todo.membershipId,
          title: 'Yapılacak hatırlatması',
          body: todo.title,
          href: '/workspace/todos',
          dedupeKey: `todo:${todo.id}:${todo.remindAt!.toISOString()}`,
        },
        update: {},
      });
      await tx.personalTodo.update({
        where: { id: todo.id },
        data: { remindedAt: now },
      });
    });
  }
  const recurring = await db.personalTodo.findMany({
    where: {
      ...scope,
      archived: false,
      dueAt: { lte: now },
      nextSpawnedAt: null,
      recurrence: { in: ['DAILY', 'WEEKLY', 'MONTHLY'] },
      membership: { active: true, role: 'ADMIN' },
    },
    take: 100,
  });
  for (const todo of recurring)
    await db.$transaction(
      async (tx) => {
        const current = await tx.personalTodo.findFirst({
          where: { id: todo.id, nextSpawnedAt: null, archived: false },
        });
        if (!current?.dueAt) return;
        const dueAt = nextOccurrence(current.dueAt, current.recurrence);
        const offset = current.remindAt
          ? current.dueAt.getTime() - current.remindAt.getTime()
          : null;
        const recurrenceKey = `${current.id}:${dueAt.toISOString()}`;
        await tx.personalTodo.upsert({
          where: { recurrenceKey },
          create: {
            organizationId: current.organizationId,
            membershipId: current.membershipId,
            title: current.title,
            description: current.description,
            priority: current.priority,
            recurrence: current.recurrence,
            dueAt,
            remindAt:
              offset === null ? null : new Date(dueAt.getTime() - offset),
            recurrenceKey,
          },
          update: {},
        });
        await tx.personalTodo.update({
          where: { id: current.id },
          data: { nextSpawnedAt: dueAt },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  return { checked: due.length, recurring: recurring.length };
}
