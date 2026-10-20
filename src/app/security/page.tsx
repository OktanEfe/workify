import { db } from '@/lib/db';
import { currentActor } from '@/lib/current-actor';
import { SecurityForm } from './form';
import Link from 'next/link';
export const dynamic = 'force-dynamic';
export default async function Security() {
  const actor = await currentActor({ allowMfaSetup: true });
  const user = await db.user.findUniqueOrThrow({
    where: { id: actor.userId },
    select: { twoFactorEnabled: true },
  });
  return (
    <main className="login-panel">
      <section className="login-card">
        <h1>Hesap güvenliği</h1>
        <p>
          {user.twoFactorEnabled
            ? 'İki aşamalı doğrulama hesabınızda etkin.'
            : 'Canlı yönetici paneline giriş için bir kez iki aşamalı doğrulama kurun. Parolanızdan sonra QR kodunu tarayıp uygulamadaki kodu girin.'}
        </p>
        {!user.twoFactorEnabled && <SecurityForm />}
        <p>
          <Link href="/workspace">Çalışma alanına dön</Link>
        </p>
      </section>
    </main>
  );
}
