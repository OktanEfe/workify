import { vi, describe, it, expect, beforeEach } from 'vitest';
const mocks = vi.hoisted(() => ({
  member: vi.fn(),
  task: vi.fn(),
  update: vi.fn(),
  list: vi.fn(),
  audit: vi.fn(),
}));
vi.mock('../src/lib/db', () => ({
  db: {
    $transaction: async (fn: (tx: unknown) => unknown) =>
      fn({
        membership: { findUnique: mocks.member },
        auditLog: { create: mocks.audit },
        task: { findFirst: mocks.task, updateMany: mocks.update },
      }),
    task: { findMany: mocks.list },
  },
}));
import { listTasks, updateTaskStatus } from '../src/services/tasks';
import type { Actor } from '../src/lib/access';
const actor: Actor = {
  userId: 'u1',
  membershipId: 'm1',
  organizationId: 'org1',
  role: 'EMPLOYEE',
  active: true,
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.member.mockResolvedValue({
    id: 'm1',
    userId: 'u1',
    organizationId: 'org1',
    role: 'EMPLOYEE',
    active: true,
  });
  mocks.task.mockResolvedValue({
    id: 't1',
    organizationId: 'org1',
    assignments: [{ membershipId: 'm1' }],
    brand: { members: [{ membershipId: 'm1' }] },
  });
  mocks.update.mockResolvedValue({ count: 1 });
});
describe('Görev servisleri', () => {
  it('liste sorgusunu kuruma, markaya ve atamaya sınırlar', async () => {
    await listTasks(actor);
    expect(mocks.list).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId: 'org1',
          deletedAt: null,
          brand: { archived: false, members: { some: { membershipId: 'm1' } } },
          assignments: { some: { membershipId: 'm1' } },
        },
        take: 30,
        skip: 0,
      }),
    );
  });
  it('sayfa sınırlarını doğrular', async () => {
    await expect(listTasks(actor, 0)).rejects.toThrow();
    expect(mocks.list).not.toHaveBeenCalled();
  });
  it('atanan görevin durumunu sürüm denetimiyle değiştirir', async () => {
    await updateTaskStatus(actor, {
      id: 't1',
      version: 3,
      status: 'COMPLETED',
    });
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: 't1', organizationId: 'org1', version: 3 },
      data: {
        status: 'COMPLETED',
        completedAt: expect.any(Date),
        version: { increment: 1 },
      },
    });
  });
  it('tamamlanan görevin ilk tamamlanma zamanını korur', async () => {
    const completedAt = new Date('2026-10-18T10:00:00Z');
    mocks.task.mockResolvedValue({
      id: 't1',
      organizationId: 'org1',
      completedAt,
      assignments: [{ membershipId: 'm1' }],
      brand: { members: [{ membershipId: 'm1' }] },
    });
    await updateTaskStatus(actor, {
      id: 't1',
      version: 2,
      status: 'COMPLETED',
    });
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ completedAt }),
      }),
    );
  });
  it('iptal edilmiş üyeliği yeniden kontrol eder', async () => {
    mocks.member.mockResolvedValue({
      userId: 'u1',
      organizationId: 'org1',
      role: 'EMPLOYEE',
      active: false,
    });
    await expect(
      updateTaskStatus(actor, { id: 't1', version: 0, status: 'TODO' }),
    ).rejects.toThrow();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.audit).not.toHaveBeenCalled();
  });
  it('eski yönetici rolüne güvenmez', async () => {
    mocks.task.mockResolvedValue({
      id: 't1',
      organizationId: 'org1',
      assignments: [],
      brand: { members: [] },
    });
    await expect(
      updateTaskStatus(
        { ...actor, role: 'ADMIN' },
        { id: 't1', version: 0, status: 'TODO' },
      ),
    ).rejects.toThrow();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.audit).not.toHaveBeenCalled();
  });
  it('başka kuruma ait kaynağı reddeder', async () => {
    mocks.task.mockResolvedValue({
      id: 't1',
      organizationId: 'org2',
      assignments: [{ membershipId: 'm1' }],
      brand: { members: [{ membershipId: 'm1' }] },
    });
    await expect(
      updateTaskStatus(actor, { id: 't1', version: 0, status: 'TODO' }),
    ).rejects.toThrow();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.audit).not.toHaveBeenCalled();
  });
  it('eşzamanlı güncelleme çakışmasını bildirir', async () => {
    mocks.update.mockResolvedValue({ count: 0 });
    await expect(
      updateTaskStatus(actor, { id: 't1', version: 0, status: 'TODO' }),
    ).rejects.toThrow('Görev değişti');
  });
});
