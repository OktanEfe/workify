import Link from 'next/link';
import { currentActor } from '@/lib/current-actor';
import { db } from '@/lib/db';
import { brandScope } from '@/services/context';
import { taskCalendar } from '@/services/task-calendar';
import { calendarMonth } from '@/lib/calendar';
import { Kanban } from '@/components/kanban';
import { CalendarBoard, type CalendarEvent } from '@/components/calendar-board';
import { MonthNavigation } from '@/components/month-navigation';
import { taskList } from '@/services/queries';
import { displayDate, localStamp } from '@/lib/dates';
export default async function Calendar({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; brand?: string; view?: string }>;
}) {
  const actor = await currentActor();
  const params = await searchParams;
  const mine = params.view === 'mine';
  const month = calendarMonth(params.month);
  const range = { gte: month.start, lt: month.end };
  const [tasks, todos, brands, board] = await Promise.all([
    taskCalendar(actor, month.start, month.end, { brand: params.brand, mine }),
    mine && actor.role === 'ADMIN' && !params.brand
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
    db.brand.findMany({
      where: mine
        ? { ...brandScope(actor), archived: false }
        : { organizationId: actor.organizationId, archived: false },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        members: {
          where: { membershipId: actor.membershipId },
          select: { membershipId: true },
        },
      },
    }),
    taskList(actor, {
      brand: params.brand,
      ...(mine ? { assignee: actor.membershipId } : {}),
    }),
  ]);
  const canCreateForBrand =
    actor.role === 'ADMIN' ||
    !params.brand ||
    brands.some(
      (brand) => brand.id === params.brand && brand.members.length > 0,
    );
  const events: CalendarEvent[] = [];
  for (const task of tasks) {
    for (const field of ['startAt', 'dueAt'] as const) {
      const date = task[field];
      if (!date || date < month.start || date >= month.end) continue;
      events.push({
        id: task.id,
        title: task.title,
        day: localStamp(date).slice(0, 10),
        time: localStamp(date).slice(11),
        href: task.canEdit ? `/workspace/tasks/${task.id}` : '',
        kind: field === 'startAt' ? 'task-start' : 'task',
        label: field === 'startAt' ? 'Başlangıç' : 'Teslim',
        brand: task.brand.name,
        employee: task.creatorRole === 'EMPLOYEE',
        status: task.status,
        version: task.canEdit ? task.version : undefined,
        field: task.canEdit ? field : undefined,
        assignees: task.assignees.join(', '),
      });
    }
  }
  for (const todo of todos) {
    if (todo.dueAt)
      events.push({
        id: todo.id,
        title: todo.title,
        day: localStamp(todo.dueAt).slice(0, 10),
        time: localStamp(todo.dueAt).slice(11),
        href: '/workspace/todos',
        kind: 'todo',
        label: 'Kişisel',
        brand: 'Yalnız siz',
      });
  }
  events.sort((a, b) => (a.day + a.time).localeCompare(b.day + b.time));
  const today = localStamp(new Date()).slice(0, 10);
  const late = tasks.filter(
    (t) =>
      t.dueAt &&
      t.dueAt < new Date() &&
      !['COMPLETED', 'CANCELLED'].includes(t.status),
  ).length;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {mine ? 'KİŞİSEL PLANINIZ' : 'EKİBİN ORTAK PLANI'} · İSTANBUL SAATİ
          </span>
          <h1>{mine ? 'Benim takvimim' : 'Ekip görev takvimi'}</h1>
          <p>
            {mine
              ? 'Yalnızca size atanmış işler ve kişisel hatırlatmalarınız.'
              : 'Kurumdaki tüm görevlerin başlangıç ve teslimlerini birlikte görün.'}
          </p>
        </div>
        <Link className="button-link" href="/workspace/tasks?new=1#new">
          ＋ Görev ekle
        </Link>
      </div>
      <aside className="personal-calendar-note">
        <span aria-hidden="true">◷</span>
        <div>
          <strong>
            {mine ? 'Bu takvim size özel' : 'Herkesin işi, ortak takvimde'}
          </strong>
          <p>
            {mine
              ? 'Yönetici olsanız da burada yalnızca sorumlusu olduğunuz işler görünür.'
              : 'Ekip görünümünde görev özetleri paylaşılır. Sadece yetkili olduğunuz görevlerin ayrıntısını açabilir ve tarihini değiştirebilirsiniz.'}
          </p>
        </div>
      </aside>
      <div className="task-calendar-views" aria-label="Takvim görünümü">
        <Link
          aria-current={!mine ? 'page' : undefined}
          href={
            '/workspace/calendar?' +
            new URLSearchParams({
              month: month.key,
            })
          }
        >
          ♧ Tüm ekip
        </Link>
        <Link
          aria-current={mine ? 'page' : undefined}
          href={
            '/workspace/calendar?' +
            new URLSearchParams({
              month: month.key,
              view: 'mine',
            })
          }
        >
          ◷ Benim takvimim
        </Link>
        <Link href="/workspace/brand-calendar">Marka paylaşım takvimi ↗</Link>
      </div>
      <section className="calendar-stats" aria-label="Seçili ayın özeti">
        <div>
          <small>Planlanan görev</small>
          <strong>{tasks.length}</strong>
        </div>
        <div>
          <small>Tamamlanan</small>
          <strong>
            {tasks.filter((t) => t.status === 'COMPLETED').length}
          </strong>
        </div>
        <div>
          <small>Geciken</small>
          <strong>{late}</strong>
        </div>
        <div>
          <small>Çalışanın eklediği</small>
          <strong>
            {tasks.filter((t) => t.creatorRole === 'EMPLOYEE').length}
          </strong>
        </div>
      </section>
      <section className="panel calendar-surface">
        <MonthNavigation
          month={month.key}
          previous={month.previous}
          next={month.next}
          brand={params.brand}
          filters={mine ? { view: 'mine' } : {}}
        />
        <form
          className="filters"
          key={(params.brand ?? '') + (mine ? 'mine' : 'team')}
        >
          <input type="hidden" name="month" value={month.key} />
          {mine && <input type="hidden" name="view" value="mine" />}
          <label>
            Markaya göre filtrele
            <select name="brand" defaultValue={params.brand}>
              <option value="">Tüm markalar</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <button>Filtrele</button>
        </form>
        {canCreateForBrand && (
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
              <input
                name="start"
                type="date"
                required
                defaultValue={
                  today.startsWith(month.key) ? today : month.key + '-01'
                }
              />
            </label>
            <button>＋ Bu güne iş planla</button>
            <p>
              Çalışanlar da yetkili oldukları markalara kendi görevlerini
              ekleyebilir. Başlangıç ve teslim ayrıca seçilir.
            </p>
          </form>
        )}
        {(tasks.length === 500 || todos.length === 500) && (
          <p>
            Gösterim sınırına ulaşıldı. Marka filtresiyle daraltın; her kaynakta
            en fazla 500 kayıt gösterilir.
          </p>
        )}
        <CalendarBoard
          key={month.key + (params.brand ?? '') + (mine ? 'mine' : 'team')}
          cells={month.cells}
          events={events}
          canCreate={canCreateForBrand}
          today={today}
          brand={params.brand}
        />
      </section>
      <details className="panel calendar-board-section">
        <summary>Görev durumlarını güncelle · kompakt pano</summary>
        <div className="panel-heading">
          <div>
            <span className="eyebrow">SÜRÜKLE · GÜNCELLE · TAMAMLA</span>
            <h2>{mine ? 'Kişisel iş panom' : 'Düzenleyebileceğim işler'}</h2>
            <p>
              {mine
                ? 'Tarihsiz işler dahil size atanmış ilk 30 görev.'
                : 'Tarihsiz işler dahil düzenleme yetkiniz olan ilk 30 görev.'}{' '}
              Kartları kırmızı, sarı ve yeşil sütunlar arasında taşıyın.
            </p>
          </div>
          <Link className="button-link" href="/workspace/tasks">
            İş panosuna git ↗
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
      </details>
    </>
  );
}
