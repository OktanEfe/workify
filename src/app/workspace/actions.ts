'use server';
import { currentActor } from '@/lib/current-actor';
import { updateTaskStatus } from '@/services/tasks';
import { revalidatePath } from 'next/cache';
export async function changeStatus(form: FormData) {
  const actor = await currentActor();
  await updateTaskStatus(actor, {
    id: form.get('id'),
    version: Number(form.get('version')),
    status: form.get('status'),
  });
  revalidatePath('/workspace');
}
