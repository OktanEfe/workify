import Link from 'next/link';
import { currentActor } from '@/lib/current-actor';
import { db } from '@/lib/db';
import { dashboard, taskList, team } from '@/services/queries';
import { displayDate } from '@/lib/dates';
import { statuses } from '@/lib/labels';
export default async function Workspace() {
  const actor = await currentActor();
  const [data, user, tasks, members] = await Promise.all([
    dashboard(actor),
    db.user.findUniqueOrThrow({
      where: { id: actor.userId },
      select: { name: true },
    }),
    taskList(actor, {}),
    actor.role === 'ADMIN' ? team(actor) : Promise.resolve([]),
  ]);
  const completed = data.counts.COMPLETED ?? 0;
  const pending = data.total - completed - (data.counts.CANCELLED ?? 0);
  const date = new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul',
    dateStyle: 'full',
  }).format(new Date());
  const max = Math.max(1, ...data.week.map((day) => day.count));
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{date}</span>
          <h1>
            Merhaba, {user.name.split(' ')[0]}
            <span className="greeting-dot">.</span>
          </h1>
          <p>
            {actor.role === 'ADMIN'
              ? 'Ajansın bugünkü ritmi, tek bir yerde.'
              : 'Size atanan işler ve yaklaşan teslimler, tek bir yerde.'}
          </p>
        </div>
        <Link
          className="button-link"
          href={
            actor.role === 'ADMIN' && data.brands === 0
              ? '/workspace/brands/new'
              : '/workspace/tasks#new'
          }
        >
          {actor.role === 'ADMIN' && data.brands === 0
            ? '＋ İlk markanı ekle'
            : '＋ Görev oluştur'}
        </Link>
      </div>
      <section className="stat-grid" aria-label="İş özeti">
        {[
          {
            label: 'Açık görevler',
            value: pending,
            detail: `${data.counts.IN_PROGRESS ?? 0} görev devam ediyor`,
            tone: '',
          },
          {
            label: 'Aktif markalar',
            value: data.brands,
            detail:
              actor.role === 'ADMIN'
                ? `${data.employees ?? 0} aktif çalışan`
                : 'Yetkili olduğunuz markalar',
            tone: '',
          },
          {
            label: 'Geciken işler',
            value: data.overdue,
            detail: 'Teslim tarihi geçmiş açık görevler',
            tone: 'warning',
          },
          {
            label: 'Tamamlanan',
            value: completed,
            detail: data.total
              ? `${data.total} görevin %${Math.round((completed / data.total) * 100)} kadarı`
              : 'İlk görevinizle başlayın',
            tone: 'positive',
          },
        ].map((item) => (
          <article key={item.label} className={`stat-card ${item.tone}`}>
            <span>{item.label}</span>
            <strong>{item.value.toLocaleString('tr-TR')}</strong>
            <small>{item.detail}</small>
          </article>
        ))}
      </section>
      <div className="dashboard-columns">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>İşlerinize genel bakış</h2>
              <p>Son işler ve yaklaşan teslimler</p>
            </div>
            <Link href="/workspace/tasks">Tüm görevler ↗</Link>
          </div>
          {tasks.items.length ? (
            <div className="task-summary">
              {tasks.items.slice(0, 6).map((task) => (
                <Link href={`/workspace/tasks/${task.id}`} key={task.id}>
                  <span className={`status-dot status-${task.status}`} />
                  <div>
                    <strong>{task.title}</strong>
                    <small>
                      {task.brand.name} · {displayDate(task.dueAt)}
                    </small>
                  </div>
                  <span className="status-badge">{statuses[task.status]}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span>▦</span>
              <h3>Yeni işler için alan açıldı</h3>
              <p>
                {actor.role === 'ADMIN'
                  ? 'Önce bir marka ekleyin, ardından ekibiniz için görev oluşturun.'
                  : 'Henüz size atanmış görev yok. Yöneticiniz marka ve görev atadığında işleriniz burada görünecek.'}
              </p>
              <Link
                href={
                  actor.role === 'ADMIN'
                    ? '/workspace/brands/new'
                    : '/workspace/tasks'
                }
              >
                {actor.role === 'ADMIN' ? '＋ Marka ekle' : 'Görevlerime git →'}
              </Link>
            </div>
          )}
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Haftanın üretimi</h2>
              <p>Son 7 günde tamamlanan görevler</p>
            </div>
            <span className="metric-chip">
              {data.week.reduce((n, d) => n + d.count, 0)} görev
            </span>
          </div>
          <div className="week-chart">
            {data.week.map((day, i) => (
              <div key={i}>
                <strong>{day.count}</strong>
                <div className="chart-track">
                  <span
                    style={{
                      height: `${Math.max(3, (day.count / max) * 100)}%`,
                    }}
                  />
                </div>
                <small>{day.label}</small>
              </div>
            ))}
          </div>
          <div className="chart-caption">
            <span>Bugün teslim edilecek</span>
            <strong>{data.today} görev</strong>
          </div>
        </section>
      </div>
      {actor.role === 'ADMIN' && (
        <div className="dashboard-columns">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Ekibin iş yükü</h2>
                <p>Görev sayısı ve planlanan süre birlikte</p>
              </div>
              <Link href="/workspace/team">Ekibe git ↗</Link>
            </div>
            <div className="team-overview">
              {members
                .filter((m) => m.active)
                .map((member) => {
                  const active = member.assignments.filter(
                    (a) => !['COMPLETED', 'CANCELLED'].includes(a.task.status),
                  );
                  const minutes = active.reduce(
                    (n, a) => n + a.task.estimatedMinutes,
                    0,
                  );
                  return (
                    <div key={member.id}>
                      <span className="avatar">
                        {member.user.name.charAt(0)}
                      </span>
                      <div>
                        <strong>{member.user.name}</strong>
                        <small>
                          {member.jobTitle ||
                            (member.role === 'ADMIN'
                              ? 'Yönetici'
                              : 'Ekip üyesi')}
                        </small>
                      </div>
                      <div className="workload-numbers">
                        <strong>{active.length} açık görev</strong>
                        <small>
                          {minutes
                            ? `${(minutes / 60).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} saat tahmini`
                            : 'Süre tahmini girilmedi'}
                        </small>
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Ajans aktivitesi</h2>
                <p>Ekibinizden son gelişmeler</p>
              </div>
              <Link href="/workspace/activity">Tümü ↗</Link>
            </div>
            {data.activity.length ? (
              <div className="activity-feed">
                {data.activity.map((activity) => (
                  <div key={activity.id}>
                    <span className="activity-marker" />
                    <div>
                      <strong>{activity.actorName}</strong>
                      <p>{activity.summary}</p>
                      <small>{displayDate(activity.createdAt)}</small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state compact">
                <h3>İlk adımı atın</h3>
                <p>
                  Marka ve görev işlemleri burada otomatik olarak kaydedilecek.
                </p>
                <Link href="/workspace/brands">Bir marka oluştur →</Link>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
