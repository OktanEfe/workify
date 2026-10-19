import { describe, it, expect, vi, afterEach } from 'vitest';
import config from '../next.config';
afterEach(() => vi.unstubAllEnvs());
describe('Güvenlik başlıkları', () => {
  it('üretimde eval izni vermez', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const headers = await config.headers!();
    const csp = headers[0].headers.find(
      (h) => h.key === 'Content-Security-Policy',
    )?.value;
    expect(csp).not.toContain('unsafe-eval');
    expect(csp).toContain("frame-ancestors 'none'");
  });
  it('geliştirmede React hata ayıklama koduna izin verir', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const headers = await config.headers!();
    expect(
      headers[0].headers.find((h) => h.key === 'Content-Security-Policy')
        ?.value,
    ).toContain('unsafe-eval');
  });
});
