import { db } from '@/lib/db';
import { currentActor } from '@/lib/current-actor';
import { SecurityForm } from './form';
import Link from 'next/link';
import { PasswordForm } from './password-form';
export const dynamic = 'force-dynamic';
export default async function Security() {
  const actor = await currentActor({ allowMfaSetup: true });
  const user = await db.user.findUniqueOrThrow({
    where: { id: actor.userId },
    select: { twoFactorEnabled: true },
  });
  return (
    <main className="security-page">
      <section className="security-shell">
        <Link className="security-brand" href="/workspace">
          avrasia<span>HESABINIZ, KONTROLÜNÜZDE</span>
        </Link>
        <h1>Hesap güvenliği</h1>
        <section className="panel security-section">
          <h2>İki aşamalı doğrulama</h2>
          <p>
            {user.twoFactorEnabled
              ? 'İki aşamalı doğrulama hesabınızda etkin.'
              : actor.role === 'ADMIN'
                ? 'Canlı yönetici paneline giriş için bir kez iki aşamalı doğrulama kurun. Parolanızdan sonra QR kodunu tarayıp uygulamadaki kodu girin.'
                : 'Hesabınıza ek koruma için iki aşamalı doğrulamayı etkinleştirebilirsiniz.'}
          </p>
          {!user.twoFactorEnabled && <SecurityForm />}
        </section>
        <section className="panel security-section">
          <h2>Parolanızı değiştirin</h2>
          <p>
            Yeni parolanızı yalnızca bu cihazda, güvenli form üzerinden girin.
          </p>
          <PasswordForm />
        </section>
        <p>
          <Link href="/workspace">Çalışma alanına dön</Link>
        </p>
      </section>
    </main>
  );
}
