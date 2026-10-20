import { describe, it, expect, vi, afterEach } from 'vitest';
const job = vi.hoisted(() => vi.fn());
vi.mock('../src/services/reminders', () => ({ runReminderBatch: job }));
import { GET } from '../src/app/api/internal/reminders/route';
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});
describe('Korumalı hatırlatma işi', () => {
  it('secret yokken hiçbir iş çalıştırmaz', async () => {
    vi.stubEnv('CRON_SECRET', '');
    expect(
      (await GET(new Request('https://workify.test/api/internal/reminders')))
        .status,
    ).toBe(503);
    expect(job).not.toHaveBeenCalled();
  });
  it('yanlış veya eksik yetkilendirmeyi reddeder', async () => {
    vi.stubEnv('CRON_SECRET', 'x'.repeat(40));
    expect(
      (
        await GET(
          new Request('https://workify.test/api/internal/reminders', {
            headers: { authorization: 'Bearer wrong' },
          }),
        )
      ).status,
    ).toBe(401);
    expect(job).not.toHaveBeenCalled();
  });
  it('doğru secret ile çalıştırır; DB hatasını dışarı sızdırmaz', async () => {
    const secret = 'x'.repeat(40);
    vi.stubEnv('CRON_SECRET', secret);
    const request = new Request('https://workify.test/api/internal/reminders', {
      headers: { authorization: `Bearer ${secret}` },
    });
    expect((await GET(request)).status).toBe(200);
    job.mockRejectedValueOnce(new Error('private db detail'));
    const r = await GET(request);
    expect(r.status).toBe(500);
    expect(await r.text()).not.toContain('private');
  });
});
