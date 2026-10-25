import type { Actor } from '@/lib/access';
import { withActor, personalTaskScope } from './context';
export async function taskCalendar(
  actor: Actor,
  start: Date,
  end: Date,
  filters: { brand?: string; mine?: boolean } = {},
) {
  if (
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(end.getTime()) ||
    end <= start ||
    end.getTime() - start.getTime() > 35 * 86400000
  )
    throw Error('Takvim aralığı geçersiz.');
  return withActor(actor, async (tx, fresh) => {
    // The team calendar is an explicitly shared, read-only projection. Full task access stays unchanged.
    const rows = await tx.task.findMany({
      where: {
        ...(filters.mine
          ? personalTaskScope(fresh)
          : { organizationId: fresh.organizationId, deletedAt: null }),
        brand: {
          archived: false,
          ...(filters.mine && fresh.role === 'EMPLOYEE'
            ? { members: { some: { membershipId: fresh.membershipId } } }
            : {}),
        },
        ...(filters.brand ? { brandId: filters.brand } : {}),
        OR: [
          { startAt: { gte: start, lt: end } },
          { dueAt: { gte: start, lt: end } },
        ],
        status: { not: 'CANCELLED' },
      },
      select: {
        id: true,
        title: true,
        startAt: true,
        dueAt: true,
        status: true,
        creatorRole: true,
        version: true,
        brand: {
          select: {
            name: true,
            members: {
              where: { membershipId: fresh.membershipId },
              select: { membershipId: true },
            },
          },
        },
        assignments: {
          select: {
            membershipId: true,
            membership: { select: { user: { select: { name: true } } } },
          },
        },
      },
      orderBy: [{ startAt: 'asc' }, { dueAt: 'asc' }, { id: 'asc' }],
      take: 500,
    });
    return rows.map(({ brand, assignments, ...task }) => ({
      ...task,
      brand: { name: brand.name },
      assignees: assignments.map((a) => a.membership.user.name),
      canEdit:
        fresh.role === 'ADMIN' ||
        (brand.members.length > 0 &&
          assignments.some((a) => a.membershipId === fresh.membershipId)),
    }));
  });
}
