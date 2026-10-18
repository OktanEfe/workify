import { describe, it, expect } from 'vitest';
import {
  assertAdmin,
  assertOrganization,
  assertTaskAccess,
  type Actor,
} from '../src/lib/access';
const actor: Actor = {
  userId: 'u1',
  membershipId: 'm1',
  organizationId: 'org1',
  role: 'EMPLOYEE',
  active: true,
};
const task = {
  organizationId: 'org1',
  brandMemberIds: ['m1'],
  assigneeIds: ['m1'],
};
describe('Kurum ve kaynak erişimi', () => {
  it('kurumlar arası erişimi yönetici için de reddeder', () => {
    expect(() =>
      assertOrganization({ ...actor, role: 'ADMIN' }, 'org2'),
    ).toThrow();
  });
  it('pasif üyeyi reddeder', () => {
    expect(() =>
      assertOrganization({ ...actor, active: false }, 'org1'),
    ).toThrow();
  });
  it('çalışan yönetici yetkisi alamaz', () => {
    expect(() => assertAdmin(actor)).toThrow();
  });
  it('aktif yöneticiyi kabul eder', () => {
    expect(() => assertAdmin({ ...actor, role: 'ADMIN' })).not.toThrow();
  });
  it('atanan ve marka üyesi çalışan erişebilir', () => {
    expect(() => assertTaskAccess(actor, task)).not.toThrow();
  });
  it('marka üyesi olmayan atanmış çalışanı reddeder', () => {
    expect(() =>
      assertTaskAccess(actor, { ...task, brandMemberIds: [] }),
    ).toThrow();
  });
  it('atanmamış marka üyesini reddeder', () => {
    expect(() =>
      assertTaskAccess(actor, { ...task, assigneeIds: [] }),
    ).toThrow();
  });
  it('kurum yöneticisi kurum görevine erişebilir', () => {
    expect(() =>
      assertTaskAccess(
        { ...actor, role: 'ADMIN' },
        { ...task, assigneeIds: [], brandMemberIds: [] },
      ),
    ).not.toThrow();
  });
});
