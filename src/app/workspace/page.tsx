import Link from 'next/link';
import { currentActor } from '@/lib/current-actor';
import { SignOut } from './sign-out';
import { changeStatus } from './actions';
import { listTasks } from '@/services/tasks';
const labels: Record<string, string> = {
  BACKLOG: 'İş havuzu',
  TODO: 'Yapılacak',
  IN_PROGRESS: 'Devam ediyor',
  IN_REVIEW: 'İncelemede',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal edildi',
};
export const dynamic = 'force-dynamic';
export default async function Workspace() {
  const actor = await currentActor();
  const tasks = await listTasks(actor);
  return (
    <div className="workspace">
      <aside>
        <Link href="/workspace" className="logo">
          w<span>workify</span>
        </Link>
        <span className="eyebrow">AVRASIA CREATIVE</span>
        <nav>
          <Link href="/workspace" aria-current="page">
            ◫ &nbsp; Genel bakış
          </Link>
        </nav>
        <small>
          {actor.role === 'ADMIN'
            ? 'Yönetici çalışma alanı'
            : 'Ekip çalışma alanı'}
        </small>
        <Link href="/security">Hesap güvenliği</Link>
        <SignOut />
      </aside>
      <main>
        <header>
          <span>Çalışma alanı / Genel bakış</span>
        </header>
        <span className="eyebrow">BİRLİKTE ÜRETİYORUZ</span>
        <h1>İşlerinize genel bakış</h1>
        <p>Size açık olan marka ve görevleri buradan takip edin.</p>
        <section className="card">
          <h2>
            Görevlerim <small>İlk 30 görev</small>
          </h2>
          {tasks.length ? (
            <table>
              <thead>
                <tr>
                  <th>Görev</th>
                  <th>Marka</th>
                  <th>Durum</th>
                  <th>Son tarih</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id}>
                    <td>{t.title}</td>
                    <td>{t.brand.name}</td>
                    <td>
                      <form action={changeStatus}>
                        <input type="hidden" name="id" value={t.id} />
                        <input type="hidden" name="version" value={t.version} />
                        <select
                          aria-label={`${t.title} durumu`}
                          name="status"
                          defaultValue={t.status}
                        >
                          {Object.entries(labels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <button className="quiet" type="submit">
                          Kaydet
                        </button>
                      </form>
                    </td>
                    <td>
                      {t.dueAt
                        ? new Intl.DateTimeFormat('tr-TR', {
                            timeZone: 'Europe/Istanbul',
                          }).format(t.dueAt)
                        : 'Belirlenmedi'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty">
              <h3>Henüz görev yok</h3>
              <p>Yetkili olduğunuz görevler burada görünecek.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
