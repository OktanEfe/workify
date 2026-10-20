import Link from 'next/link';
import { currentActor } from '@/lib/current-actor';
import { db } from '@/lib/db';
import { taskScope, brandScope } from '@/services/context';
import { contentScope } from '@/services/content';
import { calendarMonth } from '@/lib/calendar';
import { Kanban } from '@/components/kanban';
import { taskList } from '@/services/queries';
import { displayDate, localStamp } from '@/lib/dates';
export default async function Calendar({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; brand?: string }>;
}) {
  const actor = await currentActor();
  const params = await searchParams;
  const month = calendarMonth(params.month);
  const range = { gte: month.start, lt: month.end };
  const brandFilter = params.brand ? { brandId: params.brand } : {};
  const [tasks, contents, todos, brands, board] = await Promise.all([
    db.task.findMany({
      where: {
        ...taskScope(actor),
        ...brandFilter,
        OR: [{ dueAt: range }, { startAt: range }],
        status: { notIn: ['CANCELLED'] },
      },
      include: { brand: true },
      orderBy: { dueAt: 'asc' },
      take: 500,
    }),
    db.contentItem.findMany({
      where: { ...contentScope(actor), ...brandFilter, scheduledAt: range },
      include: { brand: true },
      orderBy: { scheduledAt: 'asc' },
      take: 500,
    }),
    actor.role === 'ADMIN' && !params.brand
      ? db.personalTodo.findMany({
          where: {
            organizationId: actor.organizationId,
            membershipId: actor.membershipId,
            archived: false,
            completed: false,
            dueAt: range,
          },
          orderBy: { dueAt: 'asc' },
          take: 500,
        })
      : Promise.resolve([]),
    db.brand.findMany({ where: brandScope(actor), orderBy: { name: 'asc' } }),
    taskList(actor, { brand: params.brand }),
  ]);
  const events = [
    ...tasks.flatMap((t) => [
      ...(t.startAt && t.startAt >= month.start && t.startAt < month.end
        ? [
            {
              id: t.id,
              title: t.title,
              date: t.startAt,
              href: `/workspace/tasks/${t.id}`,
              kind: 'task-start',
              label: 'Başlangıç',
              brand: t.brand.name,
            },
          ]
        : []),
      ...(t.dueAt && t.dueAt >= month.start && t.dueAt < month.end
        ? [
            {
              id: t.id,
              title: t.title,
              date: t.dueAt,
              href: `/workspace/tasks/${t.id}`,
              kind: 'task',
              label: 'Teslim',
              brand: t.brand.name,
            },
          ]
        : []),
    ]),
    ...contents.map((c) => ({
      id: c.id,
      title: c.title,
      date: c.scheduledAt!,
      href: '/workspace/content?brand=' + c.brandId,
      kind: 'content',
      label: 'İçerik',
      brand: c.brand.name,
    })),
    ...todos.map((t) => ({
      id: t.id,
      title: t.title,
      date: t.dueAt!,
      href: '/workspace/todos',
      kind: 'todo',
      label: 'Kişisel',
      brand: 'Yalnız siz',
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());
  const today = localStamp(new Date()).slice(0, 10);
  const monthLink = (key: string) =>
    '/workspace/calendar?' +
    new URLSearchParams({
      month: key,
      ...(params.brand ? { brand: params.brand } : {}),
    });
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">İSTANBUL SAATİ · AYLIK PLAN</span>
          <h1>Takvim</h1>
          <p>
            İş başlangıçları, teslimler, içerik yayın planları
            {actor.role === 'ADMIN' ? ' ve kişisel yapılacaklarınız' : ''}.
          </p>
        </div>
        <Link className="button-link" href="/workspace/content">
          İçerik takibi ↗
        </Link>
      </div>
      <section className="panel calendar-board-section">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">EKİBİN GÜNLÜK AKIŞI</span>
            <h2>İş takip panosu</h2>
            <p>Tarihsiz işler dahil, seçili markadaki son 30 görev.</p>
          </div>
          <Link className="button-link" href="/workspace/tasks">
            Tüm işler ↗
          </Link>
        </div>
        <Kanban
          tasks={board.items.map((t) => ({
            id: t.id,
            title: t.title,
            brand: t.brand.name,
            status: t.status,
            priority: t.priority,
            version: t.version,
            position: t.position,
            start: t.startAt ? displayDate(t.startAt) : undefined,
            due: displayDate(t.dueAt),
            assignees: t.assignments.map((a) => a.membership.user.name),
          }))}
        />
      </section>
      <section className="panel calendar-surface">
        <div className="calendar-toolbar">
          <Link href={monthLink(month.previous)} aria-label="Önceki ay">
            ← Önceki ay
          </Link>
          <h2>{month.label}</h2>
          <Link href={monthLink(month.next)} aria-label="Sonraki ay">
            Sonraki ay →
          </Link>
        </div>
        <form className="filters">
          <label>
            Ay
            <input name="month" type="month" defaultValue={month.key} />
          </label>
          <label>
            Marka
            <select name="brand" defaultValue={params.brand}>
              <option value="">Tüm markalar</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <button>Göster</button>
          <Link href="/workspace/calendar">Bu ay</Link>
        </form>
        <form
          action="/workspace/tasks"
          className="filters calendar-quick-create"
        >
          <input type="hidden" name="new" value="1" />
          {params.brand && (
            <input type="hidden" name="brand" value={params.brand} />
          )}
          <label>
            Hangi gün başlanacak?
            <input type="date" name="start" required defaultValue={today} />
          </label>
          <button type="submit">＋ Bu güne iş planla</button>
          <p>
            Takvimde bir günün “＋ İş” düğmesini de kullanabilirsiniz. Saat ve
            teslim tarihi görev formunda seçilir.
          </p>
        </form>
        <p>{events.length} kayıt · Görev / İçerik / Kişisel</p>
        {(tasks.length === 500 ||
          contents.length === 500 ||
          todos.length === 500) && (
          <p>
            Gösterim sınırına ulaşıldı. Marka filtresiyle daraltın; her kaynak
            için en fazla 500 kayıt gösterilir.
          </p>
        )}
        <div className="calendar-weekdays">
          {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((d) => (
            <strong key={d}>{d}</strong>
          ))}
        </div>
        <div className="calendar-grid">
          {month.cells.map((key, i) => {
            const entries = key
              ? events.filter((e) => localStamp(e.date).slice(0, 10) === key)
              : [];
            return (
              <div
                className={`calendar-day ${!key ? 'outside' : ''} ${key === today ? 'today' : ''}`}
                key={key ?? 'blank' + i}
              >
                {key && (
                  <>
                    <div className="calendar-day-heading">
                      <time dateTime={key}>{Number(key.slice(-2))}</time>
                      <Link
                        className="calendar-add-task"
                        aria-label={`${key} günü için iş ekle`}
                        href={
                          '/workspace/tasks?' +
                          new URLSearchParams({
                            start: key,
                            new: '1',
                            ...(params.brand ? { brand: params.brand } : {}),
                          }) +
                          '#new'
                        }
                      >
                        ＋ İş
                      </Link>
                    </div>
                    {entries.map((e) => (
                      <Link
                        className={`calendar-event ${e.kind}`}
                        href={e.href}
                        key={e.kind + e.id}
                      >
                        <small>
                          {e.label} · {localStamp(e.date).slice(11)}
                        </small>
                        <strong>{e.title}</strong>
                        <small>{e.brand}</small>
                      </Link>
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>
        {!events.length && (
          <p className="empty-state">
            Bu ay için tarihli kayıt yok. Görevlere başlangıç/teslim tarihi veya
            içeriklere yayın tarihi eklediğinizde burada görünür.
          </p>
        )}
      </section>
    </>
  );
}
