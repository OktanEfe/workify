export type Actor = {
  userId: string;
  membershipId: string;
  organizationId: string;
  role: 'ADMIN' | 'EMPLOYEE';
  active: boolean;
};
export class AccessDenied extends Error {
  constructor() {
    super('Bu kaynağa erişilemiyor.');
  }
}
export function assertOrganization(actor: Actor, organizationId: string) {
  if (!actor.active || actor.organizationId !== organizationId)
    throw new AccessDenied();
}
export function assertAdmin(actor: Actor) {
  assertOrganization(actor, actor.organizationId);
  if (actor.role !== 'ADMIN') throw new AccessDenied();
}
export function assertTaskAccess(
  actor: Actor,
  task: {
    organizationId: string;
    brandMemberIds: string[];
    assigneeIds: string[];
  },
) {
  assertOrganization(actor, task.organizationId);
  if (actor.role === 'ADMIN') return;
  if (
    !task.brandMemberIds.includes(actor.membershipId) ||
    !task.assigneeIds.includes(actor.membershipId)
  )
    throw new AccessDenied();
}
