import Link from 'next/link';
import { currentActor } from '@/lib/current-actor';
import { db } from '@/lib/db';
import { Navigation } from '@/components/navigation';
import { SignOut } from './sign-out';
export const dynamic = 'force-dynamic';
export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await currentActor();
  const [user, unread] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: actor.userId },
      select: { name: true },
    }),
    db.notification.count({
      where: {
        organizationId: actor.organizationId,
        membershipId: actor.membershipId,
        readAt: null,
      },
    }),
  ]);
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link className="app-brand" href="/workspace">
          <b>w</b>workify<span>AGENCY OS</span>
        </Link>
        <div className="organization-switch">
          <span className="organization-icon">A</span>
          <div>
            <strong>Avrasia Creative</strong>
            <small>Ajans çalışma alanı</small>
          </div>
        </div>
        <Navigation admin={actor.role === 'ADMIN'} />
        <div className="sidebar-profile">
          <span className="avatar">{user.name.charAt(0)}</span>
          <div>
            <strong>{user.name}</strong>
            <small>
              {actor.role === 'ADMIN'
                ? 'Yönetici çalışma alanı'
                : 'Ekip çalışma alanı'}
            </small>
          </div>
        </div>
        <div className="sidebar-bottom">
          <Link href="/security">Hesap güvenliği</Link>
          <SignOut />
        </div>
      </aside>
      <div className="app-body">
        <header className="app-topbar">
          <span>
            Çalışma alanı <b>/</b> Avrasia Creative
          </span>
          <form action="/workspace/tasks" className="top-search">
            <label className="sr-only" htmlFor="top-search">
              Görevlerde ara
            </label>
            <input
              id="top-search"
              name="q"
              placeholder="Görevlerde ara…"
              maxLength={100}
            />
            <button type="submit" aria-label="Ara">
              ⌕
            </button>
          </form>
          <Link className="notification-link" href="/workspace/notifications">
            Bildirimler {unread > 0 && <b>{unread}</b>}
          </Link>
          <span className="avatar small">{user.name.charAt(0)}</span>
        </header>
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}
