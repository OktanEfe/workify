import { z } from 'zod';
import { type Actor, AccessDenied } from '@/lib/access';
import { withActor, audit } from './context';
import { parseLocal } from '@/lib/dates';
export const todoInput = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(5000).default(''),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    dueAt: z.string().max(30).default(''),
    reminderMinutes: z.number().int().min(-1).max(10080).default(-1),
    recurrence: z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY']).default('NONE'),
  })
  .strict();
export async function createTodo(actor: Actor, input: unknown) {
  const data = todoInput.parse(input);
  const dueAt = parseLocal(data.dueAt);
  if ((data.reminderMinutes >= 0 || data.recurrence !== 'NONE') && !dueAt)
    throw new Error('Hatırlatma veya tekrarlama için tarih girin.');
  return withActor(
    actor,
    async (tx, fresh, name) => {
      const todo = await tx.personalTodo.create({
        data: {
          organizationId: fresh.organizationId,
          membershipId: fresh.membershipId,
          title: data.title,
          description: data.description,
          priority: data.priority,
          dueAt,
          remindAt:
            dueAt && data.reminderMinutes >= 0
              ? new Date(dueAt.getTime() - data.reminderMinutes * 60000)
              : null,
          recurrence: data.recurrence,
        },
      });
      await audit(tx, fresh, name, {
        action: 'CREATE',
        entity: 'PersonalTodo',
        entityId: todo.id,
        summary: 'Kişisel yapılacak oluşturuldu.',
      });
    },
    true,
  );
}
export async function changeTodo(
  actor: Actor,
  todoId: string,
  version: number,
  operation: string,
) {
  z.number().int().min(0).parse(version);
  const action = z.enum(['toggle', 'archive', 'up', 'down']).parse(operation);
  return withActor(
    actor,
    async (tx, fresh, name) => {
      const todo = await tx.personalTodo.findFirst({
        where: {
          id: todoId,
          organizationId: fresh.organizationId,
          membershipId: fresh.membershipId,
          version,
        },
      });
      if (!todo) throw new AccessDenied();
      let position = todo.position;
      if (action === 'up' || action === 'down') {
        const edge = await tx.personalTodo.aggregate({
          where: {
            organizationId: fresh.organizationId,
            membershipId: fresh.membershipId,
            archived: false,
          },
          _min: { position: true },
          _max: { position: true },
        });
        position =
          action === 'up'
            ? (edge._min.position ?? 0) - 1
            : (edge._max.position ?? 0) + 1;
      }
      await tx.personalTodo.update({
        where: { id: todo.id },
        data: {
          ...(action === 'toggle'
            ? { completed: !todo.completed }
            : action === 'archive'
              ? { archived: true }
              : { position }),
          version: { increment: 1 },
        },
      });
      await audit(tx, fresh, name, {
        action: 'UPDATE',
        entity: 'PersonalTodo',
        entityId: todo.id,
        summary: 'Kişisel yapılacak güncellendi.',
      });
    },
    true,
  );
}
export async function markNotification(actor: Actor, id: string) {
  return withActor(actor, async (tx, fresh) => {
    await tx.notification.updateMany({
      where: {
        id,
        organizationId: fresh.organizationId,
        membershipId: fresh.membershipId,
      },
      data: { readAt: new Date() },
    });
  });
}
export async function updateMember(
  actor: Actor,
  id: string,
  jobTitle: string,
  role: string,
  active: boolean,
) {
  const title = z.string().trim().max(100).parse(jobTitle);
  const value = z.enum(['ADMIN', 'EMPLOYEE']).parse(role);
  return withActor(
    actor,
    async (tx, fresh, name) => {
      const member = await tx.membership.findFirst({
        where: { id, organizationId: fresh.organizationId },
      });
      if (!member) throw new AccessDenied();
      if (id === fresh.membershipId && (!active || value !== 'ADMIN'))
        throw new Error('Kendi yönetici erişiminizi kaldıramazsınız.');
      if (
        member.role === 'ADMIN' &&
        member.active &&
        (!active || value !== 'ADMIN') &&
        (await tx.membership.count({
          where: {
            organizationId: fresh.organizationId,
            role: 'ADMIN',
            active: true,
          },
        })) <= 1
      )
        throw new Error('Son yönetici kaldırılamaz.');
      await tx.membership.update({
        where: { id },
        data: { jobTitle: title, role: value, active },
      });
      if (!active)
        await tx.session.deleteMany({ where: { userId: member.userId } });
      await audit(tx, fresh, name, {
        action: 'PERMISSION_CHANGE',
        entity: 'Membership',
        entityId: id,
        summary: 'Ekip üyesinin unvanı, rolü veya erişim durumu güncellendi.',
      });
    },
    true,
  );
}
