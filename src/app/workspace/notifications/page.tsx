import Link from 'next/link';
import { currentActor } from '@/lib/current-actor';
import { db } from '@/lib/db';
import { ActionForm } from '@/components/action-form';
import { displayDate } from '@/lib/dates';
export default async function Notifications() {
  const actor = await currentActor();
  const notifications = await db.notification.findMany({
    where: {
      organizationId: actor.organizationId,
      membershipId: actor.membershipId,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">GÜNCEL KALIN</span>
          <h1>Bildirimler</h1>
          <p>Görev atamaları, yorumlar ve kişisel hatırlatmalarınız.</p>
        </div>
      </div>
      <section className="panel">
        {notifications.map((item) => (
          <article
            className={`notification-item ${item.readAt ? '' : 'unread'}`}
            key={item.id}
          >
            <div>
              <Link href={item.href}>
                <strong>{item.title}</strong>
              </Link>
              <p>{item.body}</p>
              <small>{displayDate(item.createdAt)}</small>
            </div>
            {!item.readAt && (
              <ActionForm
                operation="notification-read"
                className="compact-form"
                label="Okundu işaretle"
              >
                <input type="hidden" name="id" value={item.id} />
              </ActionForm>
            )}
          </article>
        ))}
        {!notifications.length && (
          <div className="empty-state">
            <h3>Her şey güncel</h3>
            <p>Yeni bildirimler burada görünecek.</p>
          </div>
        )}
      </section>
    </>
  );
}
