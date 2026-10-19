import Link from 'next/link';
import { notFound } from 'next/navigation';
import { currentActor } from '@/lib/current-actor';
import { db } from '@/lib/db';
import { displayDate } from '@/lib/dates';
export default async function Activity({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; page?: string }>;
}) {
  const actor = await currentActor();
  if (actor.role !== 'ADMIN') notFound();
  const params = await searchParams;
  const page = Math.max(
    1,
    Math.min(10000, Math.floor(Number(params.page) || 1)),
  );
  const where = {
    organizationId: actor.organizationId,
    OR: [{ entity: { not: 'PersonalTodo' } }, { actorId: actor.userId }],
    ...(params.action ? { action: params.action.slice(0, 50) } : {}),
  };
  const [events, count] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 40,
      skip: (page - 1) * 40,
    }),
    db.auditLog.count({ where }),
  ]);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">AJANS HAFIZASI</span>
          <h1>Aktiviteler</h1>
          <p>
            Önemli işlemler sunucu tarafında kaydedilir; kişisel notların
            içeriği burada yer almaz.
          </p>
        </div>
      </div>
      <section className="panel">
        <form className="filter-bar">
          <select
            name="action"
            aria-label="İşlem türü"
            defaultValue={params.action}
          >
            <option value="">Tüm işlemler</option>
            {Object.entries({
              CREATE: 'Oluşturma',
              UPDATE: 'Güncelleme',
              DELETE: 'Arşivleme',
              RESTORE: 'Geri yükleme',
              ASSIGN: 'Atama',
              UNASSIGN: 'Atamayı kaldırma',
              STATUS_CHANGE: 'Durum değişikliği',
              PERMISSION_CHANGE: 'Yetki değişikliği',
            }).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
          <button>Filtrele</button>
          <span>{count} kayıt</span>
        </form>
        <div className="activity-feed">
          {events.map((event) => {
            const href =
              event.entity === 'Task'
                ? `/workspace/tasks/${event.entityId}`
                : event.entity === 'Brand'
                  ? `/workspace/brands/${event.entityId}`
                  : event.entity === 'PersonalTodo'
                    ? '/workspace/todos'
                    : event.entity === 'Membership'
                      ? '/workspace/team'
                      : '/workspace/projects';
            return (
              <div key={event.id}>
                <span className="activity-marker" />
                <div>
                  <strong>{event.actorName}</strong>
                  <p>
                    <Link href={href}>{event.summary}</Link>
                  </p>
                  <small>{displayDate(event.createdAt)}</small>
                </div>
              </div>
            );
          })}
        </div>
        {!events.length && (
          <div className="empty-state">
            <h3>Henüz işlem kaydı yok</h3>
            <p>Marka, görev ve ekip işlemleri burada listelenecek.</p>
          </div>
        )}
        <div className="pagination">
          {page > 1 && (
            <Link
              href={`/workspace/activity?page=${page - 1}&action=${encodeURIComponent(params.action ?? '')}`}
            >
              ← Önceki
            </Link>
          )}
          <span>Sayfa {page}</span>
          {page * 40 < count && (
            <Link
              href={`/workspace/activity?page=${page + 1}&action=${encodeURIComponent(params.action ?? '')}`}
            >
              Sonraki →
            </Link>
          )}
        </div>
      </section>
    </>
  );
}
