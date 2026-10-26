import { currentActor } from '@/lib/current-actor';
import { PasswordForm } from './password-form';
export const dynamic = 'force-dynamic';
export default async function Security() {
  await currentActor();
  return (
    <main className="security-page">
      <section className="security-shell">
        <a className="security-brand" href="/workspace">
          avrasia<span>HESABINIZ, KONTROLÜNÜZDE</span>
        </a>
        <h1>Hesap güvenliği</h1>
        <section className="panel security-section">
          <h2>Parolanızı değiştirin</h2>
          <p>
            Yeni parolanızı yalnızca bu cihazda, güvenli form üzerinden girin.
          </p>
          <PasswordForm />
        </section>
        <p>
          <a href="/workspace">Çalışma alanına dön</a>
        </p>
      </section>
    </main>
  );
}
