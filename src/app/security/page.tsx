import { db } from '@/lib/db';
import { currentActor } from '@/lib/current-actor';
import { SecurityForm } from './form';
import { PasswordForm } from './password-form';
export const dynamic = 'force-dynamic';
export default async function Security() {
  const actor = await currentActor({ allowMfaSetup: true });
  const user = await db.user.findUniqueOrThrow({
    where: { id: actor.userId },
    select: { twoFactorEnabled: true },
  });
  const requiresMfaSetup =
    process.env.NODE_ENV === 'production' &&
    actor.role === 'ADMIN' &&
    !user.twoFactorEnabled;
  return (
    <main className="security-page">
      <section className="security-shell">
        <a
          className="security-brand"
          href={requiresMfaSetup ? '#mfa-setup' : '/workspace'}
        >
          avrasia<span>HESABINIZ, KONTROLÜNÜZDE</span>
        </a>
        <h1>Hesap güvenliği</h1>
        <section id="mfa-setup" className="panel security-section">
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
          {requiresMfaSetup ? (
            <a href="#mfa-setup">
              Çalışma alanını açmak için doğrulamayı tamamla
            </a>
          ) : (
            <a href="/workspace">Çalışma alanına dön</a>
          )}
        </p>
      </section>
    </main>
  );
}
