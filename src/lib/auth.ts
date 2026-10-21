import { betterAuth } from 'better-auth';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { twoFactor } from 'better-auth/plugins';
import { hash, verify, argon2id } from 'argon2';
import { db } from './db';
function createAuth() {
  const secret = process.env.BETTER_AUTH_SECRET;
  const baseURL = process.env.BETTER_AUTH_URL;
  if (!secret || secret.length < 32 || !baseURL)
    throw new Error('Kimlik doğrulama ortamı yapılandırılmadı.');
  if (process.env.NODE_ENV === 'production' && !baseURL.startsWith('https://'))
    throw new Error('HTTPS zorunludur.');
  return betterAuth({
    appName: 'Avrasia',
    secret,
    baseURL,
    database: prismaAdapter(db, { provider: 'postgresql' }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
      password: {
        hash: (password) =>
          hash(password, {
            type: argon2id,
            memoryCost: 65536,
            timeCost: 3,
            parallelism: 1,
          }),
        verify: ({ hash: encoded, password }) => verify(encoded, password),
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: false },
    },
    rateLimit: {
      enabled: true,
      storage: 'database',
      window: 60,
      max: 30,
      customRules: {
        '/sign-in/email': { window: 60, max: 5 },
        '/change-password': { window: 60, max: 5 },
      },
    },
    advanced: {
      useSecureCookies: process.env.NODE_ENV === 'production',
      defaultCookieAttributes: { httpOnly: true, sameSite: 'lax' },
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== '/change-password') return;
        const session = await getAuth().api.getSession({
          headers: ctx.headers ?? new Headers(),
        });
        if (!session)
          throw new APIError('UNAUTHORIZED', { message: 'Oturum gerekli.' });
        const member = await db.membership.findFirst({
          where: { userId: session.user.id, active: true },
        });
        if (!member)
          throw new APIError('FORBIDDEN', {
            message: 'Aktif kurum üyeliği gerekli.',
          });
      }),
    },
    plugins: [twoFactor()],
  });
}
let instance: ReturnType<typeof createAuth> | undefined;
export function getAuth() {
  return (instance ??= createAuth());
}
