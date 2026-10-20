'use client';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { TaskStatus } from '@prisma/client';
import { submitOperation } from '@/app/workspace/mutations';
import { statuses, priorities } from '@/lib/labels';
import { boardLanes } from '@/lib/board';
type Card = {
  id: string;
  title: string;
  brand: string;
  status: TaskStatus;
  priority: keyof typeof priorities;
  version: number;
  position: number;
  start?: string;
  due: string;
  assignees: string[];
};
export function Kanban({ tasks }: { tasks: Card[] }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [detailed, setDetailed] = useState(false);
  const router = useRouter();
  const lanes = detailed
    ? Object.entries(statuses).map(([status, title]) => ({
        status: status as TaskStatus,
        title,
        description: '',
        states: [status as TaskStatus],
        tone:
          status === 'COMPLETED'
            ? 'done'
            : status === 'TODO'
              ? 'planned'
              : 'active',
      }))
    : boardLanes;
  function move(task: Card, status: TaskStatus) {
    if (pending || task.status === status) return;
    const form = new FormData();
    form.set('operation', 'task-status');
    form.set('id', task.id);
    form.set('version', String(task.version));
    form.set('status', status);
    form.set(
      'position',
      String(
        Math.min(
          2000000000,
          Math.max(
            0,
            ...tasks.filter((t) => t.status === status).map((t) => t.position),
          ) + 1024,
        ),
      ),
    );
    startTransition(async () => {
      try {
        setMessage('');
        const result = await submitOperation({}, form);
        setFailed(!result.ok);
        setMessage(
          result.ok
            ? `${task.title}: ${status === 'TODO' ? 'Yapılacak' : status === 'IN_PROGRESS' ? 'Yapılıyor' : status === 'COMPLETED' ? 'Yapıldı' : statuses[status]}`
            : (result.message ?? 'Kaydedilemedi.'),
        );
        router.refresh();
      } catch {
        setFailed(true);
        setMessage('Bağlantı kesildi. Sayfayı yenileyip tekrar deneyin.');
      } finally {
        setDragging(null);
        setOver(null);
      }
    });
  }
  return (
    <>
      <div className="board-toolbar">
        <p>
          Kartı sürükleyip sütuna bırakın veya kartın durum menüsünü kullanın.
        </p>
        <button
          type="button"
          className="subtle-button"
          onClick={() => setDetailed(!detailed)}
          aria-pressed={detailed}
        >
          {detailed ? 'Üç sütunlu görünüm' : 'Ayrıntılı durumlar'}
        </button>
      </div>
      {message && (
        <p role="status" className={failed ? 'form-error' : 'form-success'}>
          {message}
        </p>
      )}
      <div
        className={`kanban ${detailed ? 'kanban-detailed' : 'kanban-simple'}`}
        aria-label="İş takip panosu"
        aria-busy={pending}
      >
        {lanes.map((lane) => {
          const cards = tasks.filter((t) => lane.states.includes(t.status));
          return (
            <section
              key={lane.status}
              data-board-lane={lane.status}
              className={`kanban-lane lane-${lane.tone} ${over === lane.status ? 'drop-active' : ''}`}
              aria-label={lane.title}
              onDragOver={(e) => {
                if (!pending) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setOver(lane.status);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                const task = tasks.find(
                  (t) => t.id === e.dataTransfer.getData('text/plain'),
                );
                if (task && !lane.states.includes(task.status))
                  move(task, lane.status);
                setDragging(null);
              }}
            >
              <div className="lane-heading">
                <span className="lane-indicator" />
                <h3>{lane.title}</h3>
                <span className="lane-count">{cards.length}</span>
              </div>
              <p className="lane-description">
                {lane.description || 'Görevleri buraya taşıyın'}
              </p>
              {cards.map((task) => (
                <article
                  className={`kanban-card ${dragging === task.id ? 'is-dragging' : ''}`}
                  key={task.id}
                  draggable={!pending}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', task.id);
                    e.dataTransfer.effectAllowed = 'move';
                    setDragging(task.id);
                  }}
                  onDragEnd={() => {
                    setDragging(null);
                    setOver(null);
                  }}
                >
                  <div className="card-top">
                    <span className="eyebrow">{task.brand}</span>
                    <span
                      className="drag-handle"
                      aria-hidden="true"
                      draggable={false}
                      onPointerDown={(e) => {
                        if (pending) return;
                        e.preventDefault();
                        e.currentTarget.setPointerCapture(e.pointerId);
                        setDragging(task.id);
                      }}
                      onPointerMove={(e) => {
                        if (!e.currentTarget.hasPointerCapture(e.pointerId))
                          return;
                        const target = document
                          .elementFromPoint(e.clientX, e.clientY)
                          ?.closest('[data-board-lane]');
                        setOver(
                          target?.getAttribute('data-board-lane') ?? null,
                        );
                      }}
                      onPointerUp={(e) => {
                        if (!e.currentTarget.hasPointerCapture(e.pointerId))
                          return;
                        e.currentTarget.releasePointerCapture(e.pointerId);
                        const status = document
                          .elementFromPoint(e.clientX, e.clientY)
                          ?.closest('[data-board-lane]')
                          ?.getAttribute('data-board-lane') as
                          TaskStatus | undefined;
                        const lane = status
                          ? lanes.find((l) => l.status === status)
                          : undefined;
                        if (lane && !lane.states.includes(task.status))
                          move(task, lane.status);
                        setDragging(null);
                        setOver(null);
                      }}
                      onPointerCancel={() => {
                        setDragging(null);
                        setOver(null);
                      }}
                    >
                      ⠿
                    </span>
                  </div>
                  <Link
                    href={`/workspace/tasks/${task.id}`}
                    className="card-title"
                  >
                    {task.title}
                  </Link>
                  <span className={`priority priority-${task.priority}`}>
                    {priorities[task.priority]}
                  </span>
                  {!['TODO', 'IN_PROGRESS', 'COMPLETED'].includes(
                    task.status,
                  ) && <small>{statuses[task.status]}</small>}
                  {task.start && (
                    <small className="task-start">
                      ↗ Başlangıç: {task.start}
                    </small>
                  )}
                  <div className="card-bottom">
                    <small>◷ {task.due}</small>
                    <span
                      className="assignee-stack"
                      title={task.assignees.join(', ')}
                    >
                      {task.assignees.length ? (
                        task.assignees.slice(0, 3).map((name, i) => (
                          <span key={i} aria-label={name}>
                            {name.charAt(0)}
                          </span>
                        ))
                      ) : (
                        <small>Atanmadı</small>
                      )}
                    </span>
                  </div>
                  <label className="card-status-label">
                    Durum
                    <select
                      disabled={pending}
                      aria-label={`${task.title} durumu`}
                      value={task.status}
                      onChange={(e) => move(task, e.target.value as TaskStatus)}
                    >
                      {Object.entries(statuses).map(([value, label]) => (
                        <option value={value} key={value}>
                          {value === 'IN_PROGRESS'
                            ? 'Yapılıyor'
                            : value === 'COMPLETED'
                              ? 'Yapıldı'
                              : label}
                        </option>
                      ))}
                    </select>
                  </label>
                </article>
              ))}
              {!cards.length && (
                <div className="lane-empty">
                  <span>＋</span>
                  <p>{dragging ? 'Buraya bırak' : 'Henüz iş yok'}</p>
                </div>
              )}
            </section>
          );
        })}
      </div>
      {!detailed && tasks.some((t) => t.status === 'CANCELLED') && (
        <details className="cancelled-tasks">
          <summary>
            İptal edilen işler (
            {tasks.filter((t) => t.status === 'CANCELLED').length})
          </summary>
          {tasks
            .filter((t) => t.status === 'CANCELLED')
            .map((t) => (
              <div key={t.id}>
                <Link href={`/workspace/tasks/${t.id}`}>{t.title}</Link>
                <button disabled={pending} onClick={() => move(t, 'TODO')}>
                  Yapılacaklara al
                </button>
              </div>
            ))}
        </details>
      )}
      {pending && <p role="status">Değişiklik veritabanına kaydediliyor…</p>}
    </>
  );
}
