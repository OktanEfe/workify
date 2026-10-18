import { currentActor } from '@/lib/current-actor';
import { SecurityForm } from './form';
import Link from 'next/link';
export const dynamic = 'force-dynamic';
export default async function Security() {
  await currentActor({ allowMfaSetup: true });
  return (
    <main className="login-panel">
      <section className="login-card">
        <h1>Hesap güvenliği</h1>
        <p>Yönetici erişimi için iki aşamalı doğrulamayı etkinleştirin.</p>
        <SecurityForm />
        <p>
          <Link href="/workspace">Çalışma alanına dön</Link>
        </p>
      </section>
    </main>
  );
}
