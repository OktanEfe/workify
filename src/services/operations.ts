import { z } from 'zod';
import { db } from '@/lib/db';
import { AccessDenied, type Actor } from '@/lib/access';
import { withActor, audit, brandScope, findTask } from './context';
import { parseLocal } from '@/lib/dates';
const text = (max = 200) => z.string().trim().min(1).max(max);
const optionalText = (max = 5000) => z.string().trim().max(max).default('');
const id = text(100);
export const brandInput = z
  .object({
    name: z
      .string()
      .trim()
      .max(200)
      .transform((v) => v || 'İsimsiz marka'),
    description: optionalText(),
    sector: optionalText(100),
    website: z
      .union([
        z.literal(''),
        z
          .url()
          .refine(
            (v) => /^https?:\/\//.test(v),
            'Yalnız HTTP/HTTPS bağlantısı girin.',
          ),
      ])
      .default(''),
    contactName: optionalText(100),
    email: z.union([z.literal(''), z.email()]).default(''),
    phone: optionalText(50),
  })
  .strict();
export async function saveBrand(
  actor: Actor,
  input: unknown,
  brandId?: string,
  version?: number,
) {
  const data = brandInput.parse(input);
  return withActor(
    actor,
    async (tx, fresh, name) => {
      let record;
      if (brandId) {
        if (!Number.isInteger(version) || version === undefined || version < 0)
          throw new Error('Sürüm geçersiz.');
        const result = await tx.brand.updateMany({
          where: { id: brandId, organizationId: fresh.organizationId, version },
          data: { ...data, version: { increment: 1 } },
        });
        if (result.count !== 1)
          throw new Error(
            'Marka değişti veya erişilemiyor. Sayfayı yenileyin.',
          );
        record = { id: brandId };
      } else {
        record = await tx.brand.create({
          data: { ...data, organizationId: fresh.organizationId },
        });
        await tx.brandMember.create({
          data: {
            organizationId: fresh.organizationId,
            brandId: record.id,
            membershipId: fresh.membershipId,
          },
        });
      }
      await audit(tx, fresh, name, {
        action: brandId ? 'UPDATE' : 'CREATE',
        entity: 'Brand',
        entityId: record.id,
        brandId: record.id,
        summary: `${data.name} markası ${brandId ? 'güncellendi' : 'oluşturuldu'}.`,
      });
      return record.id;
    },
    true,
  );
}
export async function archiveBrand(actor: Actor, brandId: string) {
  return withActor(
    actor,
    async (tx, fresh, name) => {
      const brand = await tx.brand.findFirst({
        where: { id: brandId, organizationId: fresh.organizationId },
      });
      if (!brand) throw new AccessDenied();
      await tx.brand.update({
        where: { id: brand.id },
        data: { archived: !brand.archived, version: { increment: 1 } },
      });
      await audit(tx, fresh, name, {
        action: brand.archived ? 'RESTORE' : 'DELETE',
        entity: 'Brand',
        entityId: brand.id,
        brandId: brand.id,
        summary: `${brand.name} ${brand.archived ? 'yeniden etkinleştirildi' : 'arşivlendi'}.`,
      });
    },
    true,
  );
}
export async function setBrandMember(
  actor: Actor,
  brandId: string,
  membershipId: string,
  assigned: boolean,
) {
  return withActor(
    actor,
    async (tx, fresh, name) => {
      const brand = await tx.brand.findFirst({
        where: { id: brandId, organizationId: fresh.organizationId },
      });
      const member = await tx.membership.findFirst({
        where: {
          id: membershipId,
          organizationId: fresh.organizationId,
          active: true,
        },
      });
      if (!brand || !member) throw new AccessDenied();
      if (assigned)
        await tx.brandMember.upsert({
          where: { brandId_membershipId: { brandId, membershipId } },
          create: {
            organizationId: fresh.organizationId,
            brandId,
            membershipId,
          },
          update: {},
        });
      else
        await tx.brandMember.deleteMany({
          where: {
            organizationId: fresh.organizationId,
            brandId,
            membershipId,
          },
        });
      await audit(tx, fresh, name, {
        action: assigned ? 'ASSIGN' : 'UNASSIGN',
        entity: 'Brand',
        entityId: brandId,
        brandId,
        summary: `${brand.name} marka ekibi güncellendi.`,
      });
    },
    true,
  );
}
export async function brandDetail(actor: Actor, brandId: string) {
  return db.brand.findFirst({
    where: { ...brandScope(actor), id: brandId },
    include: {
      members: {
        include: {
          membership: {
            include: { user: { select: { name: true, email: true } } },
          },
        },
      },
      projects: true,
    },
  });
}
export const taskInput = z
  .object({
    title: text(),
    description: optionalText(10000),
    brandId: id,
    projectId: z.string().max(100).default(''),
    assignees: z.array(id).max(30).default([]),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    dueAt: z.string().max(30).default(''),
    estimatedMinutes: z.number().int().min(0).max(600000).default(0),
  })
  .strict();
export async function createTask(actor: Actor, input: unknown) {
  const data = taskInput.parse(input);
  return withActor(actor, async (tx, fresh, name) => {
    const brand = await tx.brand.findFirst({
      where: { ...brandScope(fresh), id: data.brandId, archived: false },
    });
    if (!brand) throw new AccessDenied();
    if (
      data.projectId &&
      !(await tx.project.findFirst({
        where: {
          id: data.projectId,
          organizationId: fresh.organizationId,
          brandId: brand.id,
        },
      }))
    )
      throw new AccessDenied();
    const assignees = [
      ...new Set(
        fresh.role === 'ADMIN' ? data.assignees : [fresh.membershipId],
      ),
    ];
    const members = await tx.membership.findMany({
      where: {
        id: { in: assignees },
        organizationId: fresh.organizationId,
        active: true,
        brands: { some: { brandId: brand.id } },
      },
    });
    if (members.length !== assignees.length)
      throw new Error('Sorumlular aktif marka ekibinden seçilmelidir.');
    const task = await tx.task.create({
      data: {
        organizationId: fresh.organizationId,
        brandId: brand.id,
        projectId: data.projectId || null,
        creatorId: fresh.userId,
        title: data.title,
        description: data.description,
        priority: data.priority,
        dueAt: parseLocal(data.dueAt),
        estimatedMinutes: data.estimatedMinutes,
        assignments: {
          create: assignees.map((membershipId) => ({ membershipId })),
        },
      },
    });
    await audit(tx, fresh, name, {
      action: 'CREATE',
      entity: 'Task',
      entityId: task.id,
      brandId: brand.id,
      summary: `${task.title} görevi oluşturuldu.`,
    });
    for (const member of members)
      if (member.userId !== fresh.userId)
        await tx.notification.create({
          data: {
            organizationId: fresh.organizationId,
            membershipId: member.id,
            title: 'Yeni görev atandı',
            body: task.title,
            href: `/workspace/tasks/${task.id}`,
          },
        });
    return task.id;
  });
}
export async function archiveTask(actor: Actor, taskId: string) {
  return withActor(
    actor,
    async (tx, fresh, name) => {
      const task = await findTask(tx, fresh, taskId);
      await tx.task.update({
        where: { id: task.id },
        data: { deletedAt: new Date(), version: { increment: 1 } },
      });
      await audit(tx, fresh, name, {
        action: 'DELETE',
        entity: 'Task',
        entityId: task.id,
        brandId: task.brandId,
        summary: `${task.title} görevi arşivlendi.`,
      });
    },
    true,
  );
}
export async function addComment(actor: Actor, taskId: string, body: string) {
  const value = text(5000).parse(body);
  return withActor(actor, async (tx, fresh, name) => {
    const task = await findTask(tx, fresh, taskId);
    await tx.taskComment.create({
      data: {
        organizationId: fresh.organizationId,
        taskId,
        authorId: fresh.userId,
        authorName: name,
        body: value,
      },
    });
    await audit(tx, fresh, name, {
      action: 'CREATE',
      entity: 'Task',
      entityId: task.id,
      brandId: task.brandId,
      summary: `${task.title} görevine yorum eklendi.`,
    });
    for (const assignee of task.assignments)
      if (assignee.membershipId !== fresh.membershipId) {
        const member = await tx.membership.findUnique({
          where: {
            id: assignee.membershipId,
            active: true,
            brands: { some: { brandId: task.brandId } },
          },
        });
        if (member?.active)
          await tx.notification.create({
            data: {
              organizationId: fresh.organizationId,
              membershipId: member.id,
              title: 'Görevde yeni yorum',
              body: task.title,
              href: `/workspace/tasks/${taskId}`,
            },
          });
      }
  });
}
export async function checklist(
  actor: Actor,
  taskId: string,
  title: string,
  itemId?: string,
) {
  return withActor(actor, async (tx, fresh, name) => {
    const task = await findTask(tx, fresh, taskId);
    if (itemId) {
      const item = await tx.checklistItem.findFirst({
        where: { id: itemId, taskId, organizationId: fresh.organizationId },
      });
      if (!item) throw new AccessDenied();
      await tx.checklistItem.update({
        where: { id: item.id },
        data: { completed: !item.completed },
      });
    } else
      await tx.checklistItem.create({
        data: {
          organizationId: fresh.organizationId,
          taskId,
          title: text(300).parse(title),
        },
      });
    await audit(tx, fresh, name, {
      action: 'UPDATE',
      entity: 'Task',
      entityId: task.id,
      brandId: task.brandId,
      summary: `${task.title} kontrol listesi güncellendi.`,
    });
  });
}
export const projectInput = z
  .object({
    name: text(),
    brandId: id,
    description: optionalText(),
    dueAt: z.string().max(30).default(''),
  })
  .strict();
export async function createProject(actor: Actor, input: unknown) {
  const data = projectInput.parse(input);
  return withActor(
    actor,
    async (tx, fresh, name) => {
      const brand = await tx.brand.findFirst({
        where: {
          organizationId: fresh.organizationId,
          id: data.brandId,
          archived: false,
        },
      });
      if (!brand) throw new AccessDenied();
      const project = await tx.project.create({
        data: {
          organizationId: fresh.organizationId,
          brandId: brand.id,
          name: data.name,
          description: data.description,
          dueAt: parseLocal(data.dueAt),
        },
      });
      await audit(tx, fresh, name, {
        action: 'CREATE',
        entity: 'Project',
        entityId: project.id,
        brandId: brand.id,
        summary: `${project.name} projesi oluşturuldu.`,
      });
    },
    true,
  );
}
export async function changeProject(
  actor: Actor,
  projectId: string,
  status: string,
) {
  const value = z
    .enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'])
    .parse(status);
  return withActor(
    actor,
    async (tx, fresh, name) => {
      const project = await tx.project.findFirst({
        where: { id: projectId, organizationId: fresh.organizationId },
      });
      if (!project) throw new AccessDenied();
      await tx.project.update({
        where: { id: project.id },
        data: { status: value },
      });
      await audit(tx, fresh, name, {
        action: 'STATUS_CHANGE',
        entity: 'Project',
        entityId: project.id,
        brandId: project.brandId,
        summary: `${project.name} proje durumu güncellendi.`,
      });
    },
    true,
  );
}

export async function editTask(
  actor: Actor,
  taskId: string,
  version: number,
  input: unknown,
) {
  const data = taskInput.parse(input);
  z.number().int().min(0).parse(version);
  return withActor(
    actor,
    async (tx, fresh, name) => {
      const task = await findTask(tx, fresh, taskId);
      if (task.brandId !== data.brandId) throw new AccessDenied();
      if (
        data.projectId &&
        !(await tx.project.findFirst({
          where: {
            id: data.projectId,
            organizationId: fresh.organizationId,
            brandId: task.brandId,
          },
        }))
      )
        throw new AccessDenied();
      const assignees = [...new Set(data.assignees)];
      const members = await tx.membership.findMany({
        where: {
          organizationId: fresh.organizationId,
          id: { in: assignees },
          active: true,
          brands: { some: { brandId: task.brandId } },
        },
      });
      if (members.length !== assignees.length)
        throw new Error('Sorumlular aktif marka ekibinden seçilmelidir.');
      const result = await tx.task.updateMany({
        where: { id: task.id, organizationId: fresh.organizationId, version },
        data: {
          title: data.title,
          description: data.description,
          projectId: data.projectId || null,
          priority: data.priority,
          dueAt: parseLocal(data.dueAt),
          estimatedMinutes: data.estimatedMinutes,
          version: { increment: 1 },
        },
      });
      if (result.count !== 1)
        throw new Error('Görev değişti. Sayfayı yenileyip tekrar deneyin.');
      await tx.taskAssignment.deleteMany({
        where: { organizationId: fresh.organizationId, taskId: task.id },
      });
      if (assignees.length)
        await tx.taskAssignment.createMany({
          data: assignees.map((membershipId) => ({
            organizationId: fresh.organizationId,
            taskId: task.id,
            membershipId,
          })),
        });
      await audit(tx, fresh, name, {
        action: 'UPDATE',
        entity: 'Task',
        entityId: task.id,
        brandId: task.brandId,
        summary: `${data.title} görevinin bilgileri ve sorumluları güncellendi.`,
      });
      for (const member of members)
        if (
          member.userId !== fresh.userId &&
          !task.assignments.some((a) => a.membershipId === member.id)
        )
          await tx.notification.create({
            data: {
              organizationId: fresh.organizationId,
              membershipId: member.id,
              title: 'Yeni görev atandı',
              body: data.title,
              href: `/workspace/tasks/${task.id}`,
            },
          });
    },
    true,
  );
}
