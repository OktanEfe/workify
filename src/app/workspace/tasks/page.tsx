import Link from 'next/link';
import { currentActor } from '@/lib/current-actor';
import { taskList, formOptions } from '@/services/queries';
import { TaskCreate } from '@/components/task-create';
import { Kanban } from '@/components/kanban';
import { statuses, priorities } from '@/lib/labels';
import { displayDate } from '@/lib/dates';
export default async function Tasks({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await currentActor();
  const raw = await searchParams;
  const filters = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [
      k,
      typeof v === 'string' ? v : undefined,
    ]),
  );
  const [data, options] = await Promise.all([
    taskList(actor, filters),
    formOptions(actor),
  ]);
  const query = new URLSearchParams(
    Object.entries(filters).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  );
  function pageLink(page: number) {
    const params = new URLSearchParams(query);
    params.set('page', String(page));
    return '/workspace/tasks?' + params.toString();
  }
  const board = filters.view === 'board';
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ÜRETİM & TESLİM</span>
          <h1>{actor.role === 'ADMIN' ? 'Görevler' : 'Görevlerim'}</h1>
          <p>
            İşleri planlayın, sorumluları belirleyin, ilerlemeyi takip edin.
          </p>
        </div>
        <a className="button-link" href="#new">
          ＋ Yeni görev
        </a>
      </div>
      <details className="panel disclosure" id="new">
        <summary>＋ Görev oluştur</summary>
        {options.brands.length ? (
          <TaskCreate
            brands={options.brands.map((b) => ({
              id: b.id,
              name: b.name,
              memberIds: b.members.map((m) => m.membershipId),
            }))}
            projects={options.projects.map((p) => ({
              id: p.id,
              name: p.name,
              brandId: p.brandId,
            }))}
            members={options.members.map((m) => ({
              id: m.id,
              name: m.user.name,
            }))}
            admin={actor.role === 'ADMIN'}
          />
        ) : (
          <p>
            Görev oluşturmak için önce yetkili olduğunuz bir marka olmalı.{' '}
            {actor.role === 'ADMIN' && (
              <Link href="/workspace/brands">Marka ekleyin →</Link>
            )}
          </p>
        )}
      </details>
      <section className="panel">
        <div className="panel-heading">
          <div className="view-switch">
            <Link
              href={
                '/workspace/tasks?' +
                new URLSearchParams({
                  ...Object.fromEntries(query),
                  view: 'list',
                  page: '1',
                })
              }
              aria-current={!board ? 'page' : undefined}
            >
              ☷ Liste
            </Link>
            <Link
              href={
                '/workspace/tasks?' +
                new URLSearchParams({
                  ...Object.fromEntries(query),
                  view: 'board',
                  page: '1',
                })
              }
              aria-current={board ? 'page' : undefined}
            >
              ▦ Kanban
            </Link>
          </div>
          <small>
            {data.count} görev · Sayfa {data.page}
          </small>
        </div>
        <form className="filter-bar">
          <input type="hidden" name="view" value={board ? 'board' : 'list'} />
          <input
            name="q"
            aria-label="Görev başlığında ara"
            placeholder="Başlıkta ara…"
            defaultValue={filters.q}
            maxLength={100}
          />
          <select name="brand" aria-label="Marka" defaultValue={filters.brand}>
            <option value="">Tüm markalar</option>
            {options.brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <select
            name="status"
            aria-label="Durum"
            defaultValue={filters.status}
          >
            <option value="">Tüm durumlar</option>
            {Object.entries(statuses).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            name="priority"
            aria-label="Öncelik"
            defaultValue={filters.priority}
          >
            <option value="">Tüm öncelikler</option>
            {Object.entries(priorities).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {actor.role === 'ADMIN' && (
            <select
              name="assignee"
              aria-label="Çalışan"
              defaultValue={filters.assignee}
            >
              <option value="">Tüm çalışanlar</option>
              {options.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.user.name}
                </option>
              ))}
            </select>
          )}
          <button>Filtrele</button>
        </form>
        {board ? (
          <Kanban
            tasks={data.items.map((t) => ({
              id: t.id,
              title: t.title,
              brand: t.brand.name,
              status: t.status,
              priority: t.priority,
              version: t.version,
              position: t.position,
              due: displayDate(t.dueAt),
              assignees: t.assignments.map((a) => a.membership.user.name),
            }))}
          />
        ) : data.items.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Görev</th>
                  <th>Marka</th>
                  <th>Sorumlular</th>
                  <th>Durum</th>
                  <th>Öncelik</th>
                  <th>Teslim</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((task) => (
                  <tr key={task.id}>
                    <td>
                      <Link href={`/workspace/tasks/${task.id}`}>
                        <strong>{task.title}</strong>
                        <small>
                          {task._count.comments} yorum · {task._count.checklist}{' '}
                          kontrol maddesi
                        </small>
                      </Link>
                    </td>
                    <td>{task.brand.name}</td>
                    <td>
                      {task.assignments
                        .map((a) => a.membership.user.name)
                        .join(', ') || 'Atanmadı'}
                    </td>
                    <td>
                      <span className="status-badge">
                        {statuses[task.status]}
                      </span>
                    </td>
                    <td>
                      <span className={`priority priority-${task.priority}`}>
                        {priorities[task.priority]}
                      </span>
                    </td>
                    <td>{displayDate(task.dueAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <h3>Görev bulunamadı</h3>
            <p>Filtreleri değiştirin veya ilk görevi oluşturun.</p>
          </div>
        )}
        <div className="pagination">
          {data.page > 1 && (
            <Link href={pageLink(data.page - 1)}>← Önceki</Link>
          )}
          <span>Her sayfada en fazla 30 görev</span>
          {data.page * 30 < data.count && (
            <Link href={pageLink(data.page + 1)}>Sonraki →</Link>
          )}
        </div>
      </section>
    </>
  );
}
