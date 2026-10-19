import Link from 'next/link';
import { notFound } from 'next/navigation';
import { currentActor } from '@/lib/current-actor';
import { db } from '@/lib/db';
import { ActionForm } from '@/components/action-form';
import { dayWindow, displayDate } from '@/lib/dates';
import { priorities } from '@/lib/labels';
export default async function Todos({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const actor = await currentActor();
  if (actor.role !== 'ADMIN') notFound();
  const { view = 'all' } = await searchParams;
  const { start, end } = dayWindow();
  const due =
    view === 'today'
      ? { gte: start, lt: end }
      : view === 'tomorrow'
        ? { gte: end, lt: new Date(end.getTime() + 86400000) }
        : view === 'week'
          ? { gte: start, lt: new Date(start.getTime() + 7 * 86400000) }
          : view === 'upcoming'
            ? { gte: end }
            : view === 'overdue'
              ? { lt: new Date() }
              : undefined;
  const todos = await db.personalTodo.findMany({
    where: {
      organizationId: actor.organizationId,
      membershipId: actor.membershipId,
      archived: false,
      ...(view === 'completed'
        ? { completed: true }
        : view !== 'all'
          ? { completed: false }
          : {}),
      ...(due ? { dueAt: due } : {}),
    },
    orderBy: [
      { completed: 'asc' },
      { position: 'asc' },
      { dueAt: 'asc' },
      { id: 'asc' },
    ],
    take: 200,
  });
  const views = {
    all: 'Tümü',
    today: 'Bugün',
    tomorrow: 'Yarın',
    week: 'Önümüzdeki 7 gün',
    upcoming: 'Yaklaşanlar',
    overdue: 'Gecikenler',
    completed: 'Tamamlananlar',
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">SADECE SİZE AİT</span>
          <h1>Yapılacaklarım</h1>
          <p>Kişisel işleriniz ve notlarınız ekibinizle paylaşılmaz.</p>
        </div>
      </div>
      <details className="panel disclosure" open={todos.length === 0}>
        <summary>＋ Yeni yapılacak</summary>
        <ActionForm operation="todo-create" label="Yapılacak ekle" reset>
          <div className="form-grid">
            <label className="span-2">
              Başlık
              <input
                name="title"
                required
                maxLength={200}
                placeholder="Örn. Müşteriyle kampanya toplantısı"
              />
            </label>
            <label>
              Tarih ve saat
              <input name="dueAt" type="datetime-local" />
              <small>İstanbul saati</small>
            </label>
            <label>
              Öncelik
              <select name="priority" defaultValue="MEDIUM">
                {Object.entries(priorities).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Hatırlatma
              <select name="reminderMinutes" defaultValue="-1">
                {[
                  [-1, 'Hatırlatma yok'],
                  [0, 'Tam zamanında'],
                  [5, '5 dakika önce'],
                  [10, '10 dakika önce'],
                  [15, '15 dakika önce'],
                  [30, '30 dakika önce'],
                  [60, '1 saat önce'],
                  [1440, '1 gün önce'],
                ].map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tekrarlama
              <select name="recurrence" defaultValue="NONE">
                <option value="NONE">Tek seferlik</option>
                <option value="DAILY">Her gün</option>
                <option value="WEEKLY">Her hafta</option>
                <option value="MONTHLY">Her ay</option>
              </select>
            </label>
            <label className="span-2">
              Kişisel not
              <textarea name="description" maxLength={5000} />
            </label>
          </div>
        </ActionForm>
      </details>
      <div className="section-tabs">
        {Object.entries(views).map(([key, label]) => (
          <Link
            key={key}
            href={`/workspace/todos?view=${key}`}
            aria-current={view === key ? 'page' : undefined}
          >
            {label}
          </Link>
        ))}
      </div>
      <section className="panel">
        {todos.map((todo) => (
          <article
            className={`todo-item ${todo.completed ? 'is-complete' : ''}`}
            key={todo.id}
          >
            <div>
              <span className={`priority priority-${todo.priority}`}>
                {priorities[todo.priority]}
              </span>
              <h2>{todo.title}</h2>
              <p className="pre-wrap">{todo.description}</p>
              <small>
                {displayDate(todo.dueAt)}
                {todo.recurrence !== 'NONE' &&
                  ` · ${todo.recurrence === 'DAILY' ? 'Her gün' : todo.recurrence === 'WEEKLY' ? 'Her hafta' : 'Her ay'}`}
                {todo.remindAt &&
                  ` · Hatırlatma: ${displayDate(todo.remindAt)}`}
              </small>
            </div>
            <div className="todo-actions">
              {[
                ['toggle', todo.completed ? 'Yeniden aç' : 'Tamamla'],
                ['up', '↑'],
                ['down', '↓'],
                ['archive', 'Arşivle'],
              ].map(([action, label]) => (
                <ActionForm
                  key={action}
                  operation="todo-update"
                  label={label}
                  className="compact-form"
                >
                  <input type="hidden" name="id" value={todo.id} />
                  <input type="hidden" name="version" value={todo.version} />
                  <input type="hidden" name="todoAction" value={action} />
                </ActionForm>
              ))}
            </div>
          </article>
        ))}
        {!todos.length && (
          <div className="empty-state">
            <h3>Bu görünümde yapılacak yok</h3>
            <p>Kendinize bir not veya tarihli hatırlatma ekleyin.</p>
          </div>
        )}
      </section>
    </>
  );
}
