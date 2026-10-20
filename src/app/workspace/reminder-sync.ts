'use server';
import { currentActor } from '@/lib/current-actor';
import { runReminderBatch } from '@/services/reminders';
export async function syncOwnReminders() {
  const actor = await currentActor();
  if (actor.role !== 'ADMIN') return false;
  const result = await runReminderBatch(new Date(), {
    organizationId: actor.organizationId,
    membershipId: actor.membershipId,
  });
  return result.checked > 0 || result.recurring > 0;
}
