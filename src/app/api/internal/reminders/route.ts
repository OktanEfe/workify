import { timingSafeEqual } from 'node:crypto';
import { runReminderBatch } from '@/services/reminders';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const received = request.headers.get('authorization') ?? '';
  if (!secret || secret.length < 32)
    return Response.json({ error: 'not_configured' }, { status: 503 });
  const expected = Buffer.from(`Bearer ${secret}`);
  const provided = Buffer.from(received);
  if (
    expected.length !== provided.length ||
    !timingSafeEqual(expected, provided)
  )
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  try {
    await runReminderBatch();
    return Response.json(
      { ok: true },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return Response.json({ error: 'retry_later' }, { status: 500 });
  }
}
