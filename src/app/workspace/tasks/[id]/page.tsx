import Link from 'next/link';
import { notFound } from 'next/navigation';
import { currentActor } from '@/lib/current-actor';
import { db } from '@/lib/db';
import { taskScope } from '@/services/context';
import { ActionForm } from '@/components/action-form';
import { statuses, priorities } from '@/lib/labels';
import { TaskCreate } from '@/components/task-create';
import { formOptions } from '@/services/queries';
import { localStamp } from '@/lib/dates';
import { displayDate } from '@/lib/dates';
export default async function TaskDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await currentActor();
  const task = await db.task.findFirst({
    where: { ...taskScope(actor), id },
    include: {
      brand: true,
      project: true,
      assignments: {
        include: {
          membership: { include: { user: { select: { name: true } } } },
        },
      },
      comments: { orderBy: { createdAt: 'asc' }, take: 100 },
      checklist: true,
    },
  });
  if (!task) notFound();
  const options = actor.role === 'ADMIN' ? await formOptions(actor) : null;
  const history = await db.auditLog.findMany({
    where: {
      organizationId: actor.organizationId,
      entity: 'Task',
      entityId: id,
    },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
  return (
    <>
      <Link className="back-link" href="/workspace/tasks">
        ← Görevler
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {task.brand.name} {task.project && ` / ${task.project.name}`}
          </span>
          <h1>{task.title}</h1>
          <p>Görev #{task.id.slice(-6).toUpperCase()}</p>
        </div>
        <span className={`priority priority-${task.priority}`}>
          {priorities[task.priority]}
        </span>
      </div>
      {options && !task.brand.archived && (
        <details className="panel disclosure">
          <summary>Görev bilgilerini ve sorumluları düzenle</summary>
          <TaskCreate
            admin
            brands={options.brands
              .filter((b) => b.id === task.brandId)
              .map((b) => ({
                id: b.id,
                name: b.name,
                memberIds: b.members.map((m) => m.membershipId),
              }))}
            projects={[
              ...options.projects,
              ...(task.project &&
              !options.projects.some((p) => p.id === task.projectId)
                ? [task.project]
                : []),
            ].map((p) => ({ id: p.id, name: p.name, brandId: p.brandId }))}
            members={options.members.map((m) => ({
              id: m.id,
              name: m.user.name,
            }))}
            task={{
              id: task.id,
              version: task.version,
              brandId: task.brandId,
              title: task.title,
              description: task.description,
              projectId: task.projectId ?? '',
              priority: task.priority,
              startAt: task.startAt ? localStamp(task.startAt) : '',
              dueAt: task.dueAt ? localStamp(task.dueAt) : '',
              estimatedMinutes: task.estimatedMinutes,
              assigneeIds: task.assignments.map((a) => a.membershipId),
            }}
          />
        </details>
      )}
      <div className="dashboard-columns">
        <div>
          <section className="panel">
            <h2>İşin kapsamı</h2>
            <p className="pre-wrap">
              {task.description || 'Açıklama eklenmedi.'}
            </p>
            <dl className="detail-list">
              <dt>Sorumlular</dt>
              <dd>
                {task.assignments
                  .map((a) => a.membership.user.name)
                  .join(', ') || 'Atanmadı'}
              </dd>
              <dt>Başlangıç</dt>
              <dd>{displayDate(task.startAt)}</dd>
              <dt>Teslim</dt>
              <dd>{displayDate(task.dueAt)}</dd>
              <dt>Tahmini süre</dt>
              <dd>
                {task.estimatedMinutes
                  ? `${task.estimatedMinutes} dakika`
                  : 'Belirlenmedi'}
              </dd>
              <dt>Oluşturuldu</dt>
              <dd>{displayDate(task.createdAt)}</dd>
            </dl>
          </section>
          <section className="panel">
            <h2>Kontrol listesi</h2>
            {task.checklist.map((item) => (
              <ActionForm
                operation="checklist"
                key={item.id}
                className="checklist-row"
                label={item.completed ? 'Geri al' : 'Tamamla'}
              >
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="itemId" value={item.id} />
                <span className={item.completed ? 'completed-text' : ''}>
                  {item.completed ? '✓' : '○'} {item.title}
                </span>
              </ActionForm>
            ))}
            <ActionForm operation="checklist" label="Madde ekle" reset>
              <input type="hidden" name="id" value={id} />
              <label>
                Yeni kontrol maddesi
                <input
                  name="title"
                  required
                  maxLength={300}
                  placeholder="Bu iş için bir adım ekleyin"
                />
              </label>
            </ActionForm>
          </section>
          <section className="panel">
            <h2>Yorumlar</h2>
            {task.comments.map((comment) => (
              <article className="comment" key={comment.id}>
                <div>
                  <strong>{comment.authorName}</strong>
                  <small>{displayDate(comment.createdAt)}</small>
                </div>
                <p className="pre-wrap">{comment.body}</p>
              </article>
            ))}
            {!task.comments.length && <p>İlk yorumu siz ekleyin.</p>}
            <ActionForm operation="comment" label="Yorumu gönder" reset>
              <input type="hidden" name="id" value={id} />
              <label>
                Yorumunuz
                <textarea name="body" required maxLength={5000} />
              </label>
            </ActionForm>
          </section>
        </div>
        <div>
          <section className="panel">
            <h2>İlerleme</h2>
            <ActionForm operation="task-status" label="Durumu güncelle">
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="version" value={task.version} />
              <label>
                Görev durumu
                <select name="status" defaultValue={task.status}>
                  {Object.entries(statuses).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </ActionForm>
            {actor.role === 'ADMIN' && (
              <div className="danger-zone">
                <ActionForm operation="task-archive" label="Görevi arşivle">
                  <input type="hidden" name="id" value={id} />
                </ActionForm>
                <small>Görev geçmişi korunur.</small>
              </div>
            )}
          </section>
          <section className="panel">
            <h2>İşlem geçmişi</h2>
            <div className="activity-feed">
              {history.map((event) => (
                <div key={event.id}>
                  <span className="activity-marker" />
                  <div>
                    <strong>{event.actorName}</strong>
                    <p>{event.summary}</p>
                    <small>{displayDate(event.createdAt)}</small>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
