import { z } from 'zod';
import type { Task } from '@prisma/client';
import { AccessDenied, type Actor } from '@/lib/access';
import { withActor, findTask, audit, type Tx } from './context';
import { taskDates, parseLocal, localStamp } from '@/lib/dates';
async function writeSchedule(
  tx: Tx,
  actor: Actor,
  name: string,
  task: Task,
  version: number,
  dates: { startAt: Date | null; dueAt: Date | null },
) {
  const changed = await tx.task.updateMany({
    where: { id: task.id, organizationId: actor.organizationId, version },
    data: { ...dates, version: { increment: 1 } },
  });
  if (changed.count !== 1)
    throw new Error('Görev değişti. Sayfayı yenileyip tekrar deneyin.');
  await audit(tx, actor, name, {
    action: 'SCHEDULE_CHANGE',
    entity: 'Task',
    entityId: task.id,
    brandId: task.brandId,
    summary: `${task.title} görevinin çalışma tarihleri değiştirildi.`,
  });
}
export async function rescheduleTask(
  actor: Actor,
  id: string,
  version: number,
  input: unknown,
) {
  const data = z
    .object({ startAt: z.string().max(30), dueAt: z.string().max(30) })
    .strict()
    .parse(input);
  z.number().int().nonnegative().parse(version);
  const dates = taskDates(data.startAt, data.dueAt);
  return withActor(actor, async (tx, fresh, name) => {
    const task = await findTask(tx, fresh, id);
    if (task.brand.archived) throw new AccessDenied();
    if (task.status === 'CANCELLED')
      throw new Error('İptal edilen görev planlanamaz.');
    await writeSchedule(tx, fresh, name, task, version, dates);
  });
}
export async function moveTaskDate(
  actor: Actor,
  id: string,
  version: number,
  day: string,
  field: string,
) {
  z.number().int().nonnegative().parse(version);
  z.enum(['startAt', 'dueAt']).parse(field);
  z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .parse(day);
  parseLocal(day + 'T00:00');
  return withActor(actor, async (tx, fresh, name) => {
    const task = await findTask(tx, fresh, id);
    if (task.brand.archived) throw new AccessDenied();
    if (task.status === 'CANCELLED')
      throw new Error('İptal edilen görev planlanamaz.');
    const original = field === 'startAt' ? task.startAt : task.dueAt;
    if (!original) throw new Error('Önce göreve tarih ekleyin.');
    const next = parseLocal(day + 'T' + localStamp(original).slice(11))!;
    const delta = next.getTime() - original.getTime();
    const startAt = field === 'startAt' ? next : task.startAt;
    const dueAt =
      field === 'startAt' && task.dueAt
        ? new Date(task.dueAt.getTime() + delta)
        : field === 'dueAt'
          ? next
          : task.dueAt;
    const dates = taskDates(
      startAt ? localStamp(startAt) : '',
      dueAt ? localStamp(dueAt) : '',
    );
    await writeSchedule(tx, fresh, name, task, version, dates);
  });
}
