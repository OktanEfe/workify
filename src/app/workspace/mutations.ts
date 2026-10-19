'use server';
import { currentActor } from '@/lib/current-actor';
import * as ops from '@/services/operations';
import {
  createTodo,
  changeTodo,
  markNotification,
  updateMember,
} from '@/services/todos';
import { updateTaskStatus } from '@/services/tasks';
import { AccessDenied } from '@/lib/access';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
export type ActionState = { ok?: boolean; message?: string; href?: string };
export async function submitOperation(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const actor = await currentActor();
  const str = (key: string) => String(form.get(key) ?? '');
  try {
    let href: string | undefined;
    switch (str('operation')) {
      case 'brand-save': {
        const id = await ops.saveBrand(
          actor,
          {
            name: str('name'),
            description: str('description'),
            sector: str('sector'),
            website: str('website'),
            contactName: str('contactName'),
            email: str('email'),
            phone: str('phone'),
          },
          str('id') || undefined,
          str('id') ? Number(str('version')) : undefined,
        );
        if (!str('id')) href = `/workspace/brands/${id}`;
        break;
      }
      case 'brand-archive':
        await ops.archiveBrand(actor, str('id'));
        break;
      case 'brand-member':
        await ops.setBrandMember(
          actor,
          str('id'),
          str('membershipId'),
          str('assigned') === 'true',
        );
        break;
      case 'task-create': {
        const id = await ops.createTask(actor, {
          title: str('title'),
          description: str('description'),
          brandId: str('brandId'),
          projectId: str('projectId'),
          assignees: form.getAll('assignees').map(String),
          priority: str('priority'),
          dueAt: str('dueAt'),
          estimatedMinutes: Number(str('estimatedMinutes')),
        });
        href = `/workspace/tasks/${id}`;
        break;
      }
      case 'task-edit':
        await ops.editTask(actor, str('id'), Number(str('version')), {
          title: str('title'),
          description: str('description'),
          brandId: str('brandId'),
          projectId: str('projectId'),
          assignees: form.getAll('assignees').map(String),
          priority: str('priority'),
          dueAt: str('dueAt'),
          estimatedMinutes: Number(str('estimatedMinutes')),
        });
        break;
      case 'task-status':
        await updateTaskStatus(actor, {
          id: str('id'),
          version: Number(str('version')),
          status: str('status'),
          ...(form.has('position')
            ? { position: Number(str('position')) }
            : {}),
        });
        break;
      case 'task-archive':
        await ops.archiveTask(actor, str('id'));
        href = '/workspace/tasks';
        break;
      case 'comment':
        await ops.addComment(actor, str('id'), str('body'));
        break;
      case 'checklist':
        await ops.checklist(
          actor,
          str('id'),
          str('title'),
          str('itemId') || undefined,
        );
        break;
      case 'project-create':
        await ops.createProject(actor, {
          name: str('name'),
          brandId: str('brandId'),
          description: str('description'),
          dueAt: str('dueAt'),
        });
        break;
      case 'project-status':
        await ops.changeProject(actor, str('id'), str('status'));
        break;
      case 'todo-create':
        await createTodo(actor, {
          title: str('title'),
          description: str('description'),
          priority: str('priority'),
          dueAt: str('dueAt'),
          reminderMinutes: Number(str('reminderMinutes')),
          recurrence: str('recurrence'),
        });
        break;
      case 'todo-update':
        await changeTodo(
          actor,
          str('id'),
          Number(str('version')),
          str('todoAction'),
        );
        break;
      case 'notification-read':
        await markNotification(actor, str('id'));
        break;
      case 'member-update':
        await updateMember(
          actor,
          str('id'),
          str('jobTitle'),
          str('role'),
          str('active') === 'true',
        );
        break;
      default:
        return { ok: false, message: 'İşlem tanınmadı.' };
    }
    revalidatePath('/workspace', 'layout');
    return { ok: true, message: 'İşlem kaydedildi.', href };
  } catch (error) {
    if (error instanceof AccessDenied)
      return {
        ok: false,
        message:
          'Bu işlem için yetkiniz yok veya kayıt artık erişilebilir değil.',
      };
    if (error instanceof z.ZodError)
      return {
        ok: false,
        message:
          'Alanları kontrol edin. Zorunlu alanlar, uzunluklar veya biçim geçersiz.',
      };
    if (
      error instanceof Error &&
      [
        'Sorumlular aktif marka ekibinden seçilmelidir.',
        'Tarih ve saat geçersiz.',
        'Tarih geçersiz.',
        'Hatırlatma veya tekrarlama için tarih girin.',
        'Kendi yönetici erişiminizi kaldıramazsınız.',
        'Son yönetici kaldırılamaz.',
        'Marka değişti veya erişilemiyor. Sayfayı yenileyin.',
        'Görev değişti. Sayfayı yenileyip tekrar deneyin.',
      ].includes(error.message)
    )
      return { ok: false, message: error.message };
    return {
      ok: false,
      message: 'İşlem tamamlanamadı. Sayfayı yenileyip tekrar deneyin.',
    };
  }
}
