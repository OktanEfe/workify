import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { db } from '../../src/lib/db';
import {
  saveBrand,
  setBrandMember,
  createTask,
  addComment,
  archiveTask,
  createProject,
  editTask,
} from '../../src/services/operations';
import { createTodo, changeTodo, updateMember } from '../../src/services/todos';
import { updateTaskStatus } from '../../src/services/tasks';
import { runReminderBatch } from '../../src/services/reminders';
import { findTask } from '../../src/services/context';
import { localStamp } from '../../src/lib/dates';
import type { Actor } from '../../src/lib/access';
const suite = process.env.RUN_DB_TESTS === '1' ? describe : describe.skip;
const orgs: string[] = [];
const users: string[] = [];
let admin: Actor;
let admin2: Actor;
let employee: Actor;
let outsider: Actor;
let unauthorized: Actor;
async function member(
  organizationId: string,
  role: 'ADMIN' | 'EMPLOYEE',
): Promise<Actor> {
  const userId = randomUUID();
  users.push(userId);
  await db.user.create({
    data: {
      id: userId,
      name: 'Integration fixture',
      email: `${userId}@example.test`,
    },
  });
  const m = await db.membership.create({
    data: { organizationId, userId, role },
  });
  return { userId, membershipId: m.id, organizationId, role, active: true };
}
async function assignedBrand() {
  const brandId = await saveBrand(admin, {
    name: 'Integration ' + randomUUID(),
  });
  await setBrandMember(admin, brandId, employee.membershipId, true);
  return brandId;
}
suite('PostgreSQL: kurum, görev, özel alan ve audit', () => {
  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL!);
    if (
      !['127.0.0.1', 'localhost'].includes(url.hostname) ||
      !url.pathname.endsWith('_test')
    )
      throw new Error('İzolasyonlu yerel test DB zorunludur.');
    for (let i = 0; i < 2; i++) {
      const o = await db.organization.create({
        data: { name: 'Integration ' + randomUUID() },
      });
      orgs.push(o.id);
    }
    admin = await member(orgs[0], 'ADMIN');
    admin2 = await member(orgs[0], 'ADMIN');
    employee = await member(orgs[0], 'EMPLOYEE');
    unauthorized = await member(orgs[0], 'EMPLOYEE');
    outsider = await member(orgs[1], 'ADMIN');
  });
  afterAll(async () => {
    const where = { organizationId: { in: orgs } };
    await db.notification.deleteMany({ where });
    await db.personalTodo.deleteMany({ where });
    await db.taskComment.deleteMany({ where });
    await db.checklistItem.deleteMany({ where });
    await db.taskAssignment.deleteMany({ where });
    await db.auditLog.deleteMany({ where });
    await db.task.deleteMany({ where });
    await db.project.deleteMany({ where });
    await db.brandMember.deleteMany({ where });
    await db.brand.deleteMany({ where });
    await db.membership.deleteMany({ where });
    await db.organization.deleteMany({ where: { id: { in: orgs } } });
    await db.user.deleteMany({ where: { id: { in: users } } });
    await db.$disconnect();
  });
  it('çalışan marka oluşturamaz; sahte ADMIN bilgisi güvenilir sayılmaz', async () => {
    await expect(
      saveBrand({ ...employee, role: 'ADMIN' }, { name: 'Yasak' }),
    ).rejects.toThrow();
    expect(
      await db.brand.count({
        where: { name: 'Yasak', organizationId: admin.organizationId },
      }),
    ).toBe(0);
  });
  it('marka, görev, atama ve audit atomik olarak kaydedilir', async () => {
    const brandId = await assignedBrand();
    const taskId = await createTask(admin, {
      brandId,
      title: 'Atanan iş',
      priority: 'HIGH',
      assignees: [employee.membershipId],
    });
    expect((await findTask(db, employee, taskId)).title).toBe('Atanan iş');
    await expect(findTask(db, unauthorized, taskId)).rejects.toThrow();
    await expect(findTask(db, outsider, taskId)).rejects.toThrow();
    expect(
      await db.auditLog.count({
        where: { entityId: taskId, action: 'CREATE' },
      }),
    ).toBe(1);
    expect(
      await db.notification.count({
        where: {
          membershipId: employee.membershipId,
          href: `/workspace/tasks/${taskId}`,
        },
      }),
    ).toBe(1);
  });
  it('farklı kurumun üyeliği veritabanı foreign key ile de reddedilir', async () => {
    const brandId = await assignedBrand();
    await expect(
      db.brandMember.create({
        data: {
          organizationId: admin.organizationId,
          brandId,
          membershipId: outsider.membershipId,
        },
      }),
    ).rejects.toThrow();
  });
  it('marka ekibinde olmayan kişiye görev atamaz', async () => {
    const brandId = await assignedBrand();
    await expect(
      createTask(admin, {
        brandId,
        title: 'Yasak atama',
        priority: 'MEDIUM',
        assignees: [unauthorized.membershipId],
      }),
    ).rejects.toThrow('Sorumlular');
  });
  it('markadan çıkarılan kişinin görev ve yorum erişimi kapanır', async () => {
    const brandId = await assignedBrand();
    const taskId = await createTask(admin, {
      brandId,
      title: 'Erişim iptali',
      priority: 'MEDIUM',
      assignees: [employee.membershipId],
    });
    await setBrandMember(admin, brandId, employee.membershipId, false);
    await expect(
      addComment(employee, taskId, 'İzinsiz yorum'),
    ).rejects.toThrow();
    await expect(findTask(db, employee, taskId)).rejects.toThrow();
  });
  it('durum sürümü çakışınca ikinci işlem ve ikinci audit oluşmaz', async () => {
    const brandId = await assignedBrand();
    const id = await createTask(admin, {
      brandId,
      title: 'Sürüm kontrolü',
      priority: 'LOW',
      assignees: [employee.membershipId],
    });
    await updateTaskStatus(employee, { id, version: 0, status: 'IN_PROGRESS' });
    await expect(
      updateTaskStatus(employee, { id, version: 0, status: 'COMPLETED' }),
    ).rejects.toThrow('Görev değişti');
    expect(
      await db.auditLog.count({
        where: { entityId: id, action: 'STATUS_CHANGE' },
      }),
    ).toBe(1);
  });
  it('soft delete yorumları ve audit geçmişini korur', async () => {
    const brandId = await assignedBrand();
    const id = await createTask(admin, {
      brandId,
      title: 'Geçmiş koruma',
      priority: 'MEDIUM',
      assignees: [employee.membershipId],
    });
    await addComment(employee, id, 'Korunacak yorum');
    await expect(archiveTask(employee, id)).rejects.toThrow();
    await archiveTask(admin, id);
    expect(
      (await db.task.findUniqueOrThrow({ where: { id } })).deletedAt,
    ).not.toBeNull();
    expect(await db.taskComment.count({ where: { taskId: id } })).toBe(1);
    expect(
      await db.auditLog.count({ where: { entityId: id, action: 'DELETE' } }),
    ).toBe(1);
    await expect(findTask(db, employee, id)).rejects.toThrow();
  });
  it('farklı markaya ait projeye görev eklenemez', async () => {
    const brandId = await assignedBrand();
    const otherBrand = await assignedBrand();
    await createProject(admin, {
      brandId: otherBrand,
      name: 'Başka marka projesi',
    });
    const project = await db.project.findFirstOrThrow({
      where: { brandId: otherBrand },
    });
    await expect(
      createTask(admin, {
        brandId,
        projectId: project.id,
        title: 'Yanlış proje',
        priority: 'MEDIUM',
      }),
    ).rejects.toThrow();
  });
  it('kişisel yapılacak başka admin ve çalışandan korunur', async () => {
    await createTodo(admin, { title: 'Özel not', priority: 'MEDIUM' });
    const todo = await db.personalTodo.findFirstOrThrow({
      where: { membershipId: admin.membershipId, title: 'Özel not' },
    });
    await expect(changeTodo(admin2, todo.id, 0, 'toggle')).rejects.toThrow();
    await expect(
      createTodo(
        { ...employee, role: 'ADMIN' },
        { title: 'Yetkisiz', priority: 'LOW' },
      ),
    ).rejects.toThrow();
    expect(
      (await db.personalTodo.findUniqueOrThrow({ where: { id: todo.id } }))
        .completed,
    ).toBe(false);
  });
  it('hatırlatma ve tekrarlayan kayıt iki turda iki kez oluşmaz', async () => {
    const dueAt = localStamp(new Date(Date.now() - 60000));
    await createTodo(admin, {
      title: 'Tekil hatırlatma',
      priority: 'HIGH',
      dueAt,
      reminderMinutes: 0,
      recurrence: 'MONTHLY',
    });
    const todo = await db.personalTodo.findFirstOrThrow({
      where: { membershipId: admin.membershipId, title: 'Tekil hatırlatma' },
    });
    await runReminderBatch();
    await runReminderBatch();
    expect(
      await db.notification.count({
        where: { dedupeKey: { startsWith: `todo:${todo.id}:` } },
      }),
    ).toBe(1);
    expect(
      await db.personalTodo.count({
        where: { recurrenceKey: { startsWith: todo.id + ':' } },
      }),
    ).toBe(1);
  });
  it('görev düzenleme yetkisi ve sürüm kontrolü korunur', async () => {
    const brandId = await assignedBrand();
    const id = await createTask(admin, {
      brandId,
      title: 'İlk başlık',
      priority: 'MEDIUM',
      assignees: [employee.membershipId],
    });
    await expect(
      editTask(employee, id, 0, {
        brandId,
        title: 'Yetkisiz',
        priority: 'HIGH',
      }),
    ).rejects.toThrow();
    await editTask(admin, id, 0, {
      brandId,
      title: 'Yeni başlık',
      priority: 'HIGH',
      assignees: [employee.membershipId],
      estimatedMinutes: 90,
    });
    expect((await db.task.findUniqueOrThrow({ where: { id } })).title).toBe(
      'Yeni başlık',
    );
    await expect(
      editTask(admin, id, 0, { brandId, title: 'Eski sürüm', priority: 'LOW' }),
    ).rejects.toThrow('Görev değişti');
    expect(
      await db.auditLog.count({ where: { entityId: id, action: 'UPDATE' } }),
    ).toBe(1);
  });
  it('yönetici kendisini devre dışı bırakamaz', async () => {
    await expect(
      updateMember(admin, admin.membershipId, '', 'EMPLOYEE', false),
    ).rejects.toThrow('Kendi yönetici');
  });
});
