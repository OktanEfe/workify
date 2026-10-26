import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  member: vi.fn(),
  user: vi.fn(),
}));
vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));
vi.mock('../src/lib/auth', () => ({
  getAuth: () => ({ api: { getSession: mocks.session } }),
}));
vi.mock('../src/lib/db', () => ({
  db: {
    membership: { findFirst: mocks.member },
    user: { findUnique: mocks.user },
  },
}));
import { currentActor } from '../src/lib/current-actor';
beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue({ user: { id: 'u1' } });
  mocks.member.mockResolvedValue({
    id: 'm1',
    organizationId: 'org1',
    role: 'EMPLOYEE',
    active: true,
  });
});
afterEach(() => vi.unstubAllEnvs());
describe('Sunucu oturum ve üyelik denetimi', () => {
  it('oturumsuz kullanıcıyı girişe gönderir', async () => {
    mocks.session.mockResolvedValue(null);
    await expect(currentActor()).rejects.toThrow('redirect:/login');
    expect(mocks.member).not.toHaveBeenCalled();
  });
  it('aktif üyeliği olmayan kullanıcıyı reddeder', async () => {
    mocks.member.mockResolvedValue(null);
    await expect(currentActor()).rejects.toThrow(
      'redirect:/login?reason=membership',
    );
  });
  it('üyelik sorgusunu oturum kullanıcısına sınırlar', async () => {
    await currentActor();
    expect(mocks.member).toHaveBeenCalledWith({
      where: { userId: 'u1', active: true },
      orderBy: { id: 'asc' },
    });
  });
  it('üretimde yönetici için ikinci doğrulama istemez', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    mocks.member.mockResolvedValue({
      id: 'm1',
      organizationId: 'org1',
      role: 'ADMIN',
      active: true,
    });
    mocks.user.mockResolvedValue({ twoFactorEnabled: false });
    expect((await currentActor()).role).toBe('ADMIN');
    expect(mocks.user).not.toHaveBeenCalled();
  });
  it('üretimde oturum ve üyelik denetimini korur', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    mocks.session.mockResolvedValue(null);
    await expect(currentActor()).rejects.toThrow('redirect:/login');
  });
  it('MFA etkin yöneticiyi kabul eder', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    mocks.member.mockResolvedValue({
      id: 'm1',
      organizationId: 'org1',
      role: 'ADMIN',
      active: true,
    });
    mocks.user.mockResolvedValue({ twoFactorEnabled: true });
    expect((await currentActor()).role).toBe('ADMIN');
  });
});
