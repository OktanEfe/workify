'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { syncOwnReminders } from '@/app/workspace/reminder-sync';
export function ReminderSync() {
  const router = useRouter();
  useEffect(() => {
    let active = true;
    let running = false;
    const tick = async () => {
      if (running || document.visibilityState !== 'visible') return;
      running = true;
      try {
        if (await syncOwnReminders()) if (active) router.refresh();
      } catch {
      } finally {
        running = false;
      }
    };
    void tick();
    const interval = setInterval(() => void tick(), 60000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [router]);
  return null;
}
