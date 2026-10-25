import {
  brandPublications,
  brandCreativeBrief,
  saveBrandIdentity,
} from '../../src/services/brand-planning';
import { taskCalendar } from '../../src/services/task-calendar';
import { calendarMonth } from '../../src/lib/calendar';
import { formOptions } from '../../src/services/queries';
import { rescheduleTask, moveTaskDate } from '../../src/services/scheduling';
import { verify, hash } from 'argon2';
import { getAuth } from '../../src/lib/auth';
import { personalTaskScope } from '../../src/services/context';
import { createEmployee } from '../../src/services/staff';
import {
  createContent,
  changeContentStatus,
  listContent,
  editContent,
} from '../../src/services/content';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import {
  importContentIdeas,
  inspirationSource,
  searchWebExamples,
} from '../../src/services/content-inspiration';
import { randomUUID } from 'node:crypto';
import { db } from '../../src/lib/db';
import {
  saveBrand,
  brandInput,
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
    await db.contentItem.deleteMany({ where });
    await db.brand.deleteMany({ where });
    await db.membership.deleteMany({ where });
    await db.organization.deleteMany({ where: { id: { in: orgs } } });
    await db.user.deleteMany({ where: { id: { in: users } } });
    await db.$disconnect();
  });
  it('çalışan yöneticisine iş atar, kendi takibi ve yönetici bildirimi korunur', async () => {
    const brandId = await assignedBrand();
    const id = await createTask(employee, {
      title: 'Yönetici onayı',
      brandId,
      priority: 'MEDIUM',
      assignees: [admin2.membershipId],
    });
    expect((await formOptions(employee)).members.map((m) => m.id)).toContain(
      admin2.membershipId,
    );
    await editTask(admin, id, 0, {
      title: 'Yönetici onayı',
      brandId,
      priority: 'MEDIUM',
      assignees: [employee.membershipId, admin2.membershipId],
    });
    const assignments = await db.taskAssignment.findMany({
      where: { taskId: id },
    });
    expect(assignments.map((a) => a.membershipId).sort()).toEqual(
      [employee.membershipId, admin2.membershipId].sort(),
    );
    expect(
      await db.notification.count({
        where: {
          membershipId: admin2.membershipId,
          href: `/workspace/tasks/${id}`,
        },
      }),
    ).toBe(1);
    expect(
      await db.task.count({ where: { id, creatorRole: 'EMPLOYEE' } }),
    ).toBe(1);
  });
  it('çalışan başka kuruma, başka çalışana veya pasif yöneticiye iş atayamaz', async () => {
    const brandId = await assignedBrand();
    await setBrandMember(admin, brandId, unauthorized.membershipId, true);
    const inactive = await member(admin.organizationId, 'ADMIN');
    await db.membership.update({
      where: { id: inactive.membershipId },
      data: { active: false },
    });
    for (const target of [
      outsider.membershipId,
      unauthorized.membershipId,
      inactive.membershipId,
    ]) {
      await expect(
        createTask(employee, {
          title: 'Yasak atama',
          brandId,
          priority: 'MEDIUM',
          assignees: [target],
        }),
      ).rejects.toThrow();
    }
    expect(
      await db.task.count({ where: { brandId, title: 'Yasak atama' } }),
    ).toBe(0);
  });
  it('kişisel takvim yönetici için de yalnız kendi atamalarını gösterir', async () => {
    const brandId = await assignedBrand();
    const own = await createTask(admin, {
      title: 'Kendi işim',
      brandId,
      priority: 'MEDIUM',
      assignees: [admin.membershipId],
    });
    const other = await createTask(admin, {
      title: 'Başkasının işi',
      brandId,
      priority: 'MEDIUM',
      assignees: [employee.membershipId],
    });
    const shared = await createTask(admin, {
      title: 'Ortak iş',
      brandId,
      priority: 'MEDIUM',
      assignees: [admin.membershipId, employee.membershipId],
    });
    const visible = (
      await db.task.findMany({
        where: { ...personalTaskScope(admin), brandId },
      })
    ).map((t) => t.id);
    expect(visible.sort()).toEqual([own, shared].sort());
    expect(visible).not.toContain(other);
    expect(
      await db.task.count({ where: { ...personalTaskScope(admin2), brandId } }),
    ).toBe(0);
    expect(
      await db.task.count({
        where: { ...personalTaskScope(outsider), brandId },
      }),
    ).toBe(0);
    await setBrandMember(admin, brandId, employee.membershipId, false);
    expect(
      await db.task.count({
        where: { ...personalTaskScope(employee), brandId },
      }),
    ).toBe(0);
  });
  it('Better Auth parola değiştirir, eski parolayı reddeder ve diğer oturumları kapatır', async () => {
    const actor = await member(admin.organizationId, 'EMPLOYEE');
    const user = await db.user.findUniqueOrThrow({
      where: { id: actor.userId },
    });
    const password = 'Fixture!' + randomUUID();
    const nextPassword = 'Changed!' + randomUUID();
    await db.account.create({
      data: {
        id: randomUUID(),
        userId: actor.userId,
        accountId: actor.userId,
        providerId: 'credential',
        password: await hash(password),
      },
    });
    const auth = getAuth();
    const login = await auth.api.signInEmail({
      body: { email: user.email, password },
      returnHeaders: true,
    });
    const cookie = login.headers
      .getSetCookie()
      .map((v) => v.split(';')[0])
      .join('; ');
    const headers = new Headers({ cookie });
    await db.session.create({
      data: {
        id: randomUUID(),
        token: randomUUID(),
        userId: actor.userId,
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    await expect(
      auth.api.changePassword({
        headers,
        body: {
          currentPassword: 'incorrect',
          newPassword: nextPassword,
          revokeOtherSessions: true,
        },
      }),
    ).rejects.toThrow();
    await auth.api.changePassword({
      headers,
      body: {
        currentPassword: password,
        newPassword: nextPassword,
        revokeOtherSessions: true,
      },
    });
    const account = await db.account.findFirstOrThrow({
      where: { userId: actor.userId, providerId: 'credential' },
    });
    expect(await verify(account.password!, nextPassword)).toBe(true);
    expect(await verify(account.password!, password)).toBe(false);
    expect(await db.session.count({ where: { userId: actor.userId } })).toBe(1);
    const secondLogin = await auth.api.signInEmail({
      body: { email: user.email, password: nextPassword },
      returnHeaders: true,
    });
    const newHeaders = new Headers({
      cookie: secondLogin.headers
        .getSetCookie()
        .map((v) => v.split(';')[0])
        .join('; '),
    });
    await db.membership.update({
      where: { id: actor.membershipId },
      data: { active: false },
    });
    await expect(
      auth.api.changePassword({
        headers: newHeaders,
        body: { currentPassword: nextPassword, newPassword: password },
      }),
    ).rejects.toThrow();
    await expect(
      auth.api.changePassword({
        body: { currentPassword: nextPassword, newPassword: password },
      }),
    ).rejects.toThrow();
  });
  it('Excel fikirleri atomik, marka kapsamlı ve tekrar aktarıma dayanıklıdır', async () => {
    const brandId = await assignedBrand();
    const row = {
      title: 'Excel fikri',
      body: 'Kahve demleme',
      channel: 'Instagram',
      format: 'Reels',
      referenceLinks: ['https://example.com/coffee'],
    };
    expect(
      await importContentIdeas(admin, { brandId, rows: [row, row] }),
    ).toEqual({ inserted: 1, skipped: 1 });
    expect(await importContentIdeas(admin, { brandId, rows: [row] })).toEqual({
      inserted: 0,
      skipped: 1,
    });
    await expect(
      importContentIdeas(outsider, { brandId, rows: [row] }),
    ).rejects.toThrow();
    expect(
      await importContentIdeas(employee, { brandId, rows: [row] }),
    ).toEqual({ inserted: 0, skipped: 1 });
    await expect(
      importContentIdeas(
        { ...unauthorized, role: 'ADMIN' },
        { brandId, rows: [row] },
      ),
    ).rejects.toThrow();
    await expect(
      importContentIdeas(admin, {
        brandId,
        rows: [
          { ...row, title: 'Geçerli' },
          { ...row, referenceLinks: ['javascript:alert(1)'] },
        ],
      }),
    ).rejects.toThrow();
    expect(await db.contentItem.count({ where: { brandId } })).toBe(1);
    const item = await db.contentItem.findFirstOrThrow({ where: { brandId } });
    expect((await inspirationSource(employee, item.id)).referenceLinks).toEqual(
      row.referenceLinks,
    );
    await expect(inspirationSource(outsider, item.id)).rejects.toThrow();
    await setBrandMember(admin, brandId, employee.membershipId, false);
    await expect(inspirationSource(employee, item.id)).rejects.toThrow();
  });
  it('web önerisi yetki, sonuç doğrulama ve kalıcı kota kontrollerinden geçer', async () => {
    const brandId = await assignedBrand();
    const id = await createContent(admin, {
      title: 'Kahve örnekleri',
      brandId,
      channel: 'Instagram',
      format: 'Reels',
    });
    const old = process.env.TAVILY_API_KEY;
    delete process.env.TAVILY_API_KEY;
    expect(
      (await searchWebExamples(employee, id, 'Kahve demleme')).configured,
    ).toBe(false);
    await expect(
      searchWebExamples(outsider, id, 'Kahve demleme'),
    ).rejects.toThrow();
    process.env.TAVILY_API_KEY = 'test-only-key';
    const mocked = vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () =>
        new Response(
          JSON.stringify({
            results: [
              {
                title: 'Kahve',
                url: 'https://example.com/coffee',
                content: 'Örnek çekim akışı',
              },
              { title: 'Yasak', url: 'javascript:alert(1)' },
              { title: 'Tekrar', url: 'https://example.com/coffee' },
            ],
          }),
        ),
    );
    try {
      const result = await searchWebExamples(employee, id, 'Kahve demleme');
      expect(result.results).toHaveLength(1);
      expect(mocked.mock.calls[0][0]).toBe('https://api.tavily.com/search');
      expect(JSON.parse(String(mocked.mock.calls[0][1]?.body)).query).toBe(
        'Kahve demleme Instagram Reels içerik örnekleri',
      );
      await searchWebExamples(employee, id, 'Kahve demleme');
      await searchWebExamples(employee, id, 'Kahve demleme');
      await expect(
        searchWebExamples(employee, id, 'Kahve demleme'),
      ).rejects.toThrow('Arama sınırına');
      await setBrandMember(admin, brandId, employee.membershipId, false);
      await expect(
        searchWebExamples(employee, id, 'Kahve demleme'),
      ).rejects.toThrow();
    } finally {
      mocked.mockRestore();
      if (old === undefined) delete process.env.TAVILY_API_KEY;
      else process.env.TAVILY_API_KEY = old;
      await db.rateLimit.deleteMany({
        where: {
          OR: orgs.map((organizationId) => ({
            key: { contains: organizationId },
          })),
        },
      });
    }
  });
  it('örnek link metinlerini yalnız istenirse okuyup arama konusunu genişletir', async () => {
    const actor = await member(admin.organizationId, 'ADMIN');
    const brandId = await assignedBrand();
    const url = 'https://example.com/espresso';
    const id = await createContent(admin, {
      title: 'Kahve',
      brandId,
      channel: 'Instagram',
      format: 'Reels',
      referenceLinks: [url],
    });
    const previous = process.env.TAVILY_API_KEY;
    process.env.TAVILY_API_KEY = 'test-only-key';
    const mocked = vi.spyOn(globalThis, 'fetch').mockImplementation(
      async (input) =>
        new Response(
          JSON.stringify(
            String(input).endsWith('/extract')
              ? {
                  results: [
                    { url, raw_content: 'Espresso çekirdek öğütme ipuçları' },
                  ],
                }
              : {
                  results: [
                    {
                      title: 'Demleme',
                      url: 'https://example.com/new',
                      content: 'Yeni örnek',
                    },
                  ],
                },
          ),
        ),
    );
    try {
      const result = await searchWebExamples(
        actor,
        id,
        'Kahve örnekleri',
        true,
      );
      expect(mocked).toHaveBeenCalledTimes(2);
      expect('analysis' in result && result.analysis?.[0]).toContain(
        'espresso',
      );
      expect(JSON.parse(String(mocked.mock.calls[1][1]?.body)).query).toContain(
        'espresso',
      );
    } finally {
      mocked.mockRestore();
      if (previous === undefined) delete process.env.TAVILY_API_KEY;
      else process.env.TAVILY_API_KEY = previous;
      await db.rateLimit.deleteMany({
        where: {
          OR: orgs.map((organizationId) => ({
            key: { contains: organizationId },
          })),
        },
      });
    }
  });
  it('çalışan kendi markasına içerik ve Excel fikri ekler; başka marka, iptal ve pasif üyelik engellenir', async () => {
    const brandId = await assignedBrand();
    const input = {
      title: 'Çalışanın paylaşımı',
      brandId,
      channel: 'Instagram',
      format: 'Reels',
      scheduledAt: '2026-10-26T14:00',
      referenceLinks: ['https://example.com/idea'],
    };
    const id = await createContent(employee, input);
    expect(
      await db.contentItem.findUniqueOrThrow({ where: { id } }),
    ).toMatchObject({
      organizationId: employee.organizationId,
      status: 'DRAFT',
    });
    expect(
      await importContentIdeas(employee, {
        brandId,
        rows: [
          {
            title: 'Excel çalışan fikri',
            body: 'Örnek',
            channel: 'YouTube',
            format: 'Video',
            referenceLinks: [],
          },
        ],
      }),
    ).toEqual({ inserted: 1, skipped: 0 });
    await expect(createContent(unauthorized, input)).rejects.toThrow();
    await expect(
      createContent({ ...unauthorized, role: 'ADMIN' }, input),
    ).rejects.toThrow();
    await expect(createContent(outsider, input)).rejects.toThrow();
    await expect(
      changeContentStatus(employee, id, 0, 'APPROVED'),
    ).rejects.toThrow();
    await setBrandMember(admin, brandId, employee.membershipId, false);
    await expect(createContent(employee, input)).rejects.toThrow();
    const inactive = await member(admin.organizationId, 'EMPLOYEE');
    await setBrandMember(admin, brandId, inactive.membershipId, true);
    await db.membership.update({
      where: { id: inactive.membershipId },
      data: { active: false },
    });
    await expect(createContent(inactive, input)).rejects.toThrow();
    await expect(
      importContentIdeas(inactive, {
        brandId,
        rows: [{ title: 'Yasak', channel: 'Instagram', format: 'Reels' }],
      }),
    ).rejects.toThrow();
  });
  it('marka paylaşım takvimi ay, kanal ve kurum/marka erişimi ile sınırlıdır', async () => {
    const brandId = await assignedBrand();
    const month = calendarMonth('2026-10');
    const input = {
      title: 'Ekim paylaşımı',
      brandId,
      channel: 'Instagram',
      format: 'Reels',
      scheduledAt: '2026-10-26T14:00',
    };
    const id = await createContent(employee, input);
    await createContent(admin, {
      ...input,
      title: 'Kasım',
      scheduledAt: '2026-11-01T00:00',
    });
    await createContent(admin, {
      ...input,
      title: 'Tarihsiz',
      scheduledAt: '',
    });
    const data = await brandPublications(employee, month.start, month.end, {
      brand: brandId,
      channel: 'Instagram',
    });
    expect(data.items.map((i) => i.id)).toEqual([id]);
    expect(data.unscheduledCount).toBe(1);
    expect(
      (
        await brandPublications(employee, month.start, month.end, {
          brand: brandId,
          channel: 'YouTube',
        })
      ).items,
    ).toHaveLength(0);
    for (const actor of [
      outsider,
      unauthorized,
      { ...unauthorized, role: 'ADMIN' as const },
    ])
      expect(
        (
          await brandPublications(actor, month.start, month.end, {
            brand: brandId,
          })
        ).items,
      ).toHaveLength(0);
    await setBrandMember(admin, brandId, employee.membershipId, false);
    expect(
      (
        await brandPublications(employee, month.start, month.end, {
          brand: brandId,
        })
      ).items,
    ).toHaveLength(0);
    await db.brand.update({ where: { id: brandId }, data: { archived: true } });
    expect(
      (
        await brandPublications(admin, month.start, month.end, {
          brand: brandId,
        })
      ).items,
    ).toHaveLength(0);
  });
  it('marka kimliği ekipçe güncellenir; başka kurum, atanmayan çalışan, sürüm ve alan taşması reddedilir', async () => {
    const brandId = await assignedBrand();
    const initial = await brandCreativeBrief(employee, brandId);
    await saveBrandIdentity(employee, brandId, initial.version, {
      brandIdentity: 'Sıcak ve samimi',
      targetAudience: 'Kahve severler',
      palette: '#1A2B4C #FFFFFF',
      visualDirection: 'Doğal ışık',
      designPlan: '3 gönderi, 1 Reels',
      assetLinks: ['https://example.com/brand-guide'],
    });
    const saved = await brandCreativeBrief(admin, brandId);
    expect(saved).toMatchObject({
      brandIdentity: 'Sıcak ve samimi',
      designPlan: '3 gönderi, 1 Reels',
      version: initial.version + 1,
    });
    await expect(
      saveBrandIdentity(employee, brandId, initial.version, {
        designPlan: 'Eski sürüm',
      }),
    ).rejects.toThrow('Marka değişti');
    for (const actor of [
      outsider,
      unauthorized,
      { ...unauthorized, role: 'ADMIN' as const },
    ]) {
      await expect(brandCreativeBrief(actor, brandId)).rejects.toThrow();
      await expect(
        saveBrandIdentity(actor, brandId, saved.version, {
          designPlan: 'Yetkisiz',
        }),
      ).rejects.toThrow();
    }
    await expect(
      saveBrandIdentity(employee, brandId, saved.version, {
        name: 'Marka ismini değiştir',
      }),
    ).rejects.toThrow();
    await setBrandMember(admin, brandId, employee.membershipId, false);
    await expect(
      saveBrandIdentity(employee, brandId, saved.version, {
        designPlan: 'İptal sonrası',
      }),
    ).rejects.toThrow();
    expect((await brandCreativeBrief(admin, brandId)).designPlan).toBe(
      '3 gönderi, 1 Reels',
    );
  });
  it('ortak görev takvimi yalnız kurum içi özet paylaşır; kişisel görünüm ve düzenleme yetkisi korunur', async () => {
    const brandId = await assignedBrand();
    const month = calendarMonth('2026-10');
    const id = await createTask(admin, {
      title: 'Ekipte görünür',
      description: 'Özel görev ayrıntısı',
      brandId,
      priority: 'MEDIUM',
      startAt: '2026-10-26T09:00',
      dueAt: '2026-10-28T18:00',
      assignees: [employee.membershipId],
    });
    const team = await taskCalendar(unauthorized, month.start, month.end, {
      brand: brandId,
    });
    expect(team.map((t) => t.id)).toEqual([id]);
    expect(team[0].canEdit).toBe(false);
    expect(team[0]).not.toHaveProperty('description');
    expect(team[0]).not.toHaveProperty('assignments');
    expect(team[0]).not.toHaveProperty('organizationId');
    expect(
      (
        await taskCalendar(
          { ...unauthorized, role: 'ADMIN' },
          month.start,
          month.end,
          { brand: brandId },
        )
      )[0].canEdit,
    ).toBe(false);
    expect(
      await taskCalendar(unauthorized, month.start, month.end, {
        brand: brandId,
        mine: true,
      }),
    ).toHaveLength(0);
    expect(
      (
        await taskCalendar(employee, month.start, month.end, {
          brand: brandId,
          mine: true,
        })
      )[0].canEdit,
    ).toBe(true);
    expect(
      await taskCalendar(outsider, month.start, month.end, { brand: brandId }),
    ).toHaveLength(0);
    await expect(
      updateTaskStatus(unauthorized, {
        id,
        version: 0,
        status: 'COMPLETED',
        position: 1024,
      }),
    ).rejects.toThrow();
    await setBrandMember(admin, brandId, employee.membershipId, false);
    expect(
      await taskCalendar(employee, month.start, month.end, {
        brand: brandId,
        mine: true,
      }),
    ).toHaveLength(0);
    expect(
      (
        await taskCalendar(employee, month.start, month.end, { brand: brandId })
      )[0].canEdit,
    ).toBe(false);
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
  it('boş marka formunu varsayılan adla kaydeder', async () => {
    const id = await saveBrand(admin, { name: '' });
    expect((await db.brand.findUniqueOrThrow({ where: { id } })).name).toBe(
      'İsimsiz marka',
    );
  });
  it('yönetici çalışan oluşturur; çalışan ve sahte rol oluşturamaz', async () => {
    const email = randomUUID() + '@example.test';
    const password = 'IntegrationOnly!123';
    await expect(
      createEmployee(
        { ...employee, role: 'ADMIN' },
        { name: 'Test employee', email, password, confirmation: password },
      ),
    ).rejects.toThrow();
    const id = await createEmployee(admin, {
      name: 'Test employee',
      email,
      password,
      confirmation: password,
    });
    const m = await db.membership.findUniqueOrThrow({
      where: { id },
      include: { user: { include: { accounts: true } } },
    });
    users.push(m.userId);
    expect(m.role).toBe('EMPLOYEE');
    expect(m.organizationId).toBe(admin.organizationId);
    expect(await verify(m.user.accounts[0].password!, password)).toBe(true);
    await expect(
      createEmployee(admin, {
        name: 'Duplicate',
        email,
        password,
        confirmation: password,
      }),
    ).rejects.toThrow('zaten kullanılıyor');
    await expect(
      createEmployee(admin, {
        name: 'Mismatch',
        email: randomUUID() + '@example.test',
        password,
        confirmation: 'wrong',
      }),
    ).rejects.toThrow();
  });
  it('içerik erişimi marka ve kurumla sınırlıdır; çalışan durum değiştiremez', async () => {
    const brandId = await assignedBrand();
    const id = await createContent(admin, {
      title: 'Planlanan içerik',
      brandId,
      channel: 'Instagram',
      format: 'Reels',
      scheduledAt: '2026-10-20T12:00',
    });
    expect((await listContent(employee)).some((c) => c.id === id)).toBe(true);
    expect((await listContent(unauthorized)).some((c) => c.id === id)).toBe(
      false,
    );
    expect((await listContent(outsider)).some((c) => c.id === id)).toBe(false);
    await expect(
      changeContentStatus(employee, id, 0, 'APPROVED'),
    ).rejects.toThrow();
    await expect(
      createContent(outsider, {
        title: 'Wrong org',
        brandId,
        channel: 'Web',
        format: 'Yazı',
      }),
    ).rejects.toThrow();
    await expect(
      db.contentItem.create({
        data: {
          organizationId: outsider.organizationId,
          brandId,
          title: 'Invalid FK',
        },
      }),
    ).rejects.toThrow();
    await setBrandMember(admin, brandId, employee.membershipId, false);
    expect((await listContent(employee)).some((c) => c.id === id)).toBe(false);
  });
  it('içerik yayın kaydı onay ve sürüm kontrolü gerektirir', async () => {
    const brandId = await assignedBrand();
    const id = await createContent(admin, {
      title: 'Yayın denetimi',
      brandId,
      channel: 'Web',
      format: 'Yazı',
    });
    await expect(
      changeContentStatus(admin, id, 0, 'SCHEDULED'),
    ).rejects.toThrow('yayın tarihi');
    await expect(
      changeContentStatus(admin, id, 0, 'PUBLISHED'),
    ).rejects.toThrow('onaylayın');
    await changeContentStatus(admin, id, 0, 'APPROVED');
    await expect(changeContentStatus(admin, id, 0, 'REVISION')).rejects.toThrow(
      'İçerik değişti',
    );
    await changeContentStatus(admin, id, 1, 'PUBLISHED');
    expect(
      (await db.contentItem.findUniqueOrThrow({ where: { id } })).publishedAt,
    ).not.toBeNull();
  });
  it('içerik düzenleme onayı sıfırlar ve başka kurumdan korunur', async () => {
    const brandId = await assignedBrand();
    const input = {
      title: 'Düzenleme',
      brandId,
      channel: 'Instagram',
      format: 'Reels',
      scheduledAt: '2026-10-21T10:00',
    };
    const id = await createContent(admin, input);
    await changeContentStatus(admin, id, 0, 'APPROVED');
    await expect(editContent(outsider, id, 1, input)).rejects.toThrow();
    await expect(editContent(employee, id, 1, input)).rejects.toThrow();
    await editContent(admin, id, 1, {
      ...input,
      title: 'Güncel metin',
      scheduledAt: '2026-10-22T11:30',
    });
    const item = await db.contentItem.findUniqueOrThrow({ where: { id } });
    expect(item.status).toBe('DRAFT');
    expect(item.title).toBe('Güncel metin');
    expect(localStamp(item.scheduledAt!)).toBe('2026-10-22T11:30');
    await expect(editContent(admin, id, 1, input)).rejects.toThrow(
      'İçerik değişti',
    );
  });
  it('oturum yenilemesi yalnız kendi yöneticisinin hatırlatmalarını işler', async () => {
    const dueAt = localStamp(new Date(Date.now() - 60000));
    await createTodo(admin, {
      title: 'Scoped owner',
      priority: 'MEDIUM',
      dueAt,
      reminderMinutes: 0,
    });
    await createTodo(admin2, {
      title: 'Other owner',
      priority: 'MEDIUM',
      dueAt,
      reminderMinutes: 0,
    });
    await runReminderBatch(new Date(), {
      organizationId: admin.organizationId,
      membershipId: admin.membershipId,
    });
    const own = await db.personalTodo.findFirstOrThrow({
      where: { membershipId: admin.membershipId, title: 'Scoped owner' },
    });
    const other = await db.personalTodo.findFirstOrThrow({
      where: { membershipId: admin2.membershipId, title: 'Other owner' },
    });
    expect(own.remindedAt).not.toBeNull();
    expect(other.remindedAt).toBeNull();
  });
  it('markanın web sitesi ve iletişim bilgileri boş veya atlanmış olabilir', async () => {
    const id = await saveBrand(admin, {
      name: 'Web sitesi olmayan marka',
      website: '   ',
      email: '   ',
    });
    const brand = await db.brand.findUniqueOrThrow({ where: { id } });
    expect(brand.website).toBe('');
    expect(brand.email).toBe('');
    expect(brandInput.parse({}).name).toBe('İsimsiz marka');
    expect(
      brandInput.parse({ name: 'Web', website: 'www.example.com' }).website,
    ).toBe('https://www.example.com');
    expect(() =>
      brandInput.parse({ website: 'javascript:alert(1)' }),
    ).toThrow();
  });
  it('başlangıç ve teslim tarihi görevde kaydedilir ve güvenli düzenlenir', async () => {
    const brandId = await assignedBrand();
    const input = {
      brandId,
      title: 'Tarihli görev',
      priority: 'MEDIUM',
      startAt: '2026-10-22T09:00',
      dueAt: '2026-10-23T18:00',
      assignees: [employee.membershipId],
    };
    const id = await createTask(admin, input);
    const task = await db.task.findUniqueOrThrow({ where: { id } });
    expect(localStamp(task.startAt!)).toBe('2026-10-22T09:00');
    expect(localStamp(task.dueAt!)).toBe('2026-10-23T18:00');
    await expect(
      editTask(outsider, id, 0, { ...input, startAt: '2026-10-22T10:00' }),
    ).rejects.toThrow();
    await expect(editTask(employee, id, 0, input)).rejects.toThrow();
    await editTask(admin, id, 0, { ...input, startAt: '2026-10-22T10:00' });
    expect(
      localStamp((await db.task.findUniqueOrThrow({ where: { id } })).startAt!),
    ).toBe('2026-10-22T10:00');
    await expect(
      createTask(admin, { ...input, startAt: '2026-10-24T09:00' }),
    ).rejects.toThrow('başlangıç tarihinden önce');
    await expect(
      editTask(admin, id, 1, { ...input, startAt: '2026-10-24T09:00' }),
    ).rejects.toThrow('başlangıç tarihinden önce');
    expect((await db.task.findUniqueOrThrow({ where: { id } })).version).toBe(
      1,
    );
  });
  it('çalışan ek görev oluşturur, tarihini ve durumunu değiştirebilir', async () => {
    const brandId = await assignedBrand();
    const id = await createTask(employee, {
      brandId,
      title: 'Çalışanın ek işi',
      priority: 'HIGH',
      startAt: '2026-10-29T10:30',
      dueAt: '2026-10-30T18:00',
    });
    let task = await db.task.findUniqueOrThrow({
      where: { id },
      include: { assignments: true },
    });
    expect(task.creatorRole).toBe('EMPLOYEE');
    expect(task.creatorId).toBe(employee.userId);
    expect(task.assignments[0].membershipId).toBe(employee.membershipId);
    await moveTaskDate(employee, id, 0, '2026-11-02', 'startAt');
    task = await db.task.findUniqueOrThrow({
      where: { id },
      include: { assignments: true },
    });
    expect(localStamp(task.startAt!)).toBe('2026-11-02T10:30');
    expect(localStamp(task.dueAt!)).toBe('2026-11-03T18:00');
    await updateTaskStatus(employee, { id, version: 1, status: 'IN_PROGRESS' });
    await updateTaskStatus(employee, { id, version: 2, status: 'COMPLETED' });
    await rescheduleTask(employee, id, 3, {
      startAt: '2026-11-04T09:00',
      dueAt: '2026-11-05T17:00',
    });
    expect((await db.task.findUniqueOrThrow({ where: { id } })).status).toBe(
      'COMPLETED',
    );
    await expect(
      moveTaskDate(employee, id, 3, '2026-11-06', 'dueAt'),
    ).rejects.toThrow('Görev değişti');
  });
  it('takvimden taşıma başka kurumdan, atanmayan çalışandan ve marka iptalinden korunur', async () => {
    const brandId = await assignedBrand();
    const id = await createTask(admin, {
      brandId,
      title: 'İzolasyonlu takvim',
      priority: 'MEDIUM',
      startAt: '2026-10-22T09:00',
      dueAt: '2026-10-23T18:00',
      assignees: [employee.membershipId],
    });
    for (const actor of [outsider, unauthorized]) {
      await expect(
        moveTaskDate(actor, id, 0, '2026-10-24', 'startAt'),
      ).rejects.toThrow();
      await expect(
        rescheduleTask(actor, id, 0, {
          startAt: '2026-10-22T10:00',
          dueAt: '2026-10-23T18:00',
        }),
      ).rejects.toThrow();
    }
    await setBrandMember(admin, brandId, employee.membershipId, false);
    await expect(
      moveTaskDate(employee, id, 0, '2026-10-24', 'startAt'),
    ).rejects.toThrow();
    expect((await db.task.findUniqueOrThrow({ where: { id } })).version).toBe(
      0,
    );
  });
  it('teslim taşınırken başlangıç değişmez ve geçersiz tarih reddedilir', async () => {
    const brandId = await assignedBrand();
    const id = await createTask(employee, {
      brandId,
      title: 'Teslim taşıma',
      priority: 'MEDIUM',
      startAt: '2026-10-22T09:00',
      dueAt: '2026-10-23T18:00',
    });
    await moveTaskDate(employee, id, 0, '2026-10-25', 'dueAt');
    const task = await db.task.findUniqueOrThrow({ where: { id } });
    expect(localStamp(task.startAt!)).toBe('2026-10-22T09:00');
    expect(localStamp(task.dueAt!)).toBe('2026-10-25T18:00');
    await expect(
      moveTaskDate(employee, id, 1, '2026-10-21', 'dueAt'),
    ).rejects.toThrow('başlangıç tarihinden önce');
    await expect(
      moveTaskDate(employee, id, 1, '2026-02-30', 'dueAt'),
    ).rejects.toThrow();
  });
});
