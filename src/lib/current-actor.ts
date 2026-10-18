import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuth } from './auth';
import { db } from './db';
import type { Actor } from './access';
export async function currentActor(
  options: { allowMfaSetup?: boolean } = {},
): Promise<Actor> {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) redirect('/login');
  const member = await db.membership.findFirst({
    where: { userId: session.user.id, active: true },
    orderBy: { id: 'asc' },
  });
  if (!member) redirect('/login?reason=membership');
  if (
    process.env.NODE_ENV === 'production' &&
    member.role === 'ADMIN' &&
    !options.allowMfaSetup
  ) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorEnabled: true },
    });
    if (!user?.twoFactorEnabled) redirect('/security');
  }
  return {
    userId: session.user.id,
    membershipId: member.id,
    organizationId: member.organizationId,
    role: member.role,
    active: member.active,
  };
}
