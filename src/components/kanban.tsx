'use client';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { submitOperation } from '@/app/workspace/mutations';
import { statuses, priorities } from '@/lib/labels';
type Card = {
  id: string;
  title: string;
  brand: string;
  status: keyof typeof statuses;
  priority: keyof typeof priorities;
  version: number;
  position: number;
  due: string;
  assignees: string[];
};
export function Kanban({ tasks }: { tasks: Card[] }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const router = useRouter();
  return (
    <>
      <p className="hint">
        Kartları sütunlar arasında sürükleyin. Liste filtreleri burada da
        geçerlidir.
      </p>
      {message && (
        <p role="status" className="form-error">
          {message}
        </p>
      )}
      <div className="kanban">
        {Object.entries(statuses).map(([status, label]) => (
          <section
            className="kanban-lane"
            key={status}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (pending) return;
              const task = tasks.find(
                (t) => t.id === e.dataTransfer.getData('text/plain'),
              );
              if (!task || task.status === status) return;
              const form = new FormData();
              form.set('operation', 'task-status');
              form.set('id', task.id);
              form.set('version', String(task.version));
              form.set('status', status);
              form.set(
                'position',
                String(
                  Math.max(
                    0,
                    ...tasks
                      .filter((t) => t.status === status)
                      .map((t) => t.position),
                  ) + 1024,
                ),
              );
              startTransition(async () => {
                setMessage('');
                const result = await submitOperation({}, form);
                if (!result.ok) setMessage(result.message ?? 'Kaydedilemedi.');
                router.refresh();
              });
            }}
          >
            <h3>
              {label}
              <span>{tasks.filter((t) => t.status === status).length}</span>
            </h3>
            {tasks
              .filter((t) => t.status === status)
              .map((task) => (
                <article
                  className="kanban-card"
                  key={task.id}
                  draggable={!pending}
                  onDragStart={(e) =>
                    e.dataTransfer.setData('text/plain', task.id)
                  }
                >
                  <span className="eyebrow">{task.brand}</span>
                  <Link href={`/workspace/tasks/${task.id}`}>{task.title}</Link>
                  <small>{task.due}</small>
                  <div>
                    <span className={`priority priority-${task.priority}`}>
                      {priorities[task.priority]}
                    </span>
                    <small>{task.assignees.join(', ') || 'Atanmadı'}</small>
                  </div>
                </article>
              ))}
          </section>
        ))}
      </div>
      {pending && <p role="status">Durum kaydediliyor…</p>}
    </>
  );
}
