import { db } from '@/lib/db';
import { assertAdmin, type Actor } from '@/lib/access';
import { taskScope, brandScope } from './context';
import { dayWindow, localStamp } from '@/lib/dates';
import { z } from 'zod';
export async function dashboard(actor: Actor) {
  const where = taskScope(actor);
  const { start, end } = dayWindow();
  const open = {
    notIn: ['COMPLETED', 'CANCELLED'] as ('COMPLETED' | 'CANCELLED')[],
  };
  const [groups, overdue, today, brands, employees, activity, recent] =
    await Promise.all([
      db.task.groupBy({ by: ['status'], where, _count: { _all: true } }),
      db.task.count({
        where: { ...where, status: open, dueAt: { lt: new Date() } },
      }),
      db.task.count({
        where: { ...where, status: open, dueAt: { gte: start, lt: end } },
      }),
      db.brand.count({ where: { ...brandScope(actor), archived: false } }),
      actor.role === 'ADMIN'
        ? db.membership.count({
            where: {
              organizationId: actor.organizationId,
              role: 'EMPLOYEE',
              active: true,
            },
          })
        : Promise.resolve(null),
      actor.role === 'ADMIN'
        ? db.auditLog.findMany({
            where: {
              organizationId: actor.organizationId,
              OR: [
                { entity: { not: 'PersonalTodo' } },
                { actorId: actor.userId },
              ],
            },
            orderBy: { createdAt: 'desc' },
            take: 8,
          })
        : Promise.resolve([]),
      db.task.findMany({
        where: {
          ...where,
          completedAt: { gte: new Date(start.getTime() - 6 * 86400000) },
        },
        select: { completedAt: true },
      }),
    ]);
  const counts = Object.fromEntries(
    groups.map((g) => [g.status, g._count._all]),
  );
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start.getTime() - (6 - i) * 86400000);
    const key = localStamp(date).slice(0, 10);
    return {
      label: new Intl.DateTimeFormat('tr-TR', {
        timeZone: 'Europe/Istanbul',
        weekday: 'short',
      }).format(date),
      count: recent.filter(
        (t) => t.completedAt && localStamp(t.completedAt).slice(0, 10) === key,
      ).length,
    };
  });
  return {
    counts,
    total: groups.reduce((n, g) => n + g._count._all, 0),
    overdue,
    today,
    brands,
    employees,
    activity,
    week,
  };
}
export async function taskList(
  actor: Actor,
  filters: Record<string, string | undefined>,
) {
  const status = z
    .enum([
      'BACKLOG',
      'TODO',
      'IN_PROGRESS',
      'IN_REVIEW',
      'REVISION',
      'COMPLETED',
      'CANCELLED',
    ])
    .safeParse(filters.status);
  const priority = z
    .enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .safeParse(filters.priority);
  const page = Math.max(
    1,
    Math.min(10000, Math.floor(Number(filters.page) || 1)),
  );
  const where = {
    ...taskScope(actor),
    ...(status.success ? { status: status.data } : {}),
    ...(priority.success ? { priority: priority.data } : {}),
    ...(filters.brand ? { brandId: filters.brand } : {}),
    ...(filters.q
      ? {
          title: {
            contains: filters.q.slice(0, 100),
            mode: 'insensitive' as const,
          },
        }
      : {}),
    ...(filters.assignee
      ? {
          assignments: { some: { membershipId: filters.assignee } },
          AND: taskScope(actor),
        }
      : {}),
  };
  const [items, count] = await Promise.all([
    db.task.findMany({
      where,
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }, { id: 'asc' }],
      take: 30,
      skip: (page - 1) * 30,
      include: {
        brand: { select: { name: true } },
        assignments: {
          include: {
            membership: { include: { user: { select: { name: true } } } },
          },
        },
        _count: { select: { comments: true, checklist: true } },
      },
    }),
    db.task.count({ where }),
  ]);
  return { items, count, page };
}
export async function formOptions(actor: Actor) {
  const [brands, projects, members] = await Promise.all([
    db.brand.findMany({
      where: { ...brandScope(actor), archived: false },
      orderBy: { name: 'asc' },
      take: 200,
      include: { members: { select: { membershipId: true } } },
    }),
    db.project.findMany({
      where: {
        organizationId: actor.organizationId,
        brand: brandScope(actor),
        status: 'ACTIVE',
      },
      take: 200,
    }),
    actor.role === 'ADMIN'
      ? db.membership.findMany({
          where: { organizationId: actor.organizationId, active: true },
          orderBy: { user: { name: 'asc' } },
          take: 200,
          include: { user: { select: { name: true, email: true } } },
        })
      : db.membership.findMany({
          where: {
            id: actor.membershipId,
            organizationId: actor.organizationId,
            active: true,
          },
          include: { user: { select: { name: true, email: true } } },
        }),
  ]);
  return { brands, projects, members };
}
export async function team(actor: Actor) {
  assertAdmin(actor);
  return db.membership.findMany({
    where: { organizationId: actor.organizationId },
    orderBy: { user: { name: 'asc' } },
    take: 200,
    include: {
      user: { select: { name: true, email: true, image: true } },
      brands: { include: { brand: { select: { name: true } } } },
      assignments: {
        where: { task: { deletedAt: null } },
        include: {
          task: {
            select: {
              status: true,
              dueAt: true,
              estimatedMinutes: true,
              priority: true,
            },
          },
        },
      },
    },
  });
}
