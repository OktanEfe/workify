'use client';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { statuses } from '@/lib/labels';
import { submitOperation } from '@/app/workspace/mutations';
export type CalendarEvent = {
  id: string;
  title: string;
  day: string;
  time: string;
  href: string;
  kind: string;
  label: string;
  brand: string;
  employee?: boolean;
  status?: string;
  version?: number;
  field?: 'startAt' | 'dueAt';
  assignees?: string;
};
export function CalendarBoard({
  cells,
  events,
  today,
  brand,
  canCreate = true,
}: {
  cells: (string | null)[];
  events: CalendarEvent[];
  today: string;
  brand?: string;
  canCreate?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState(
    cells.includes(today)
      ? today
      : (cells.find((d): d is string => d !== null) ?? today),
  );
  const router = useRouter();
  function eventKey(e: CalendarEvent) {
    return e.kind + ':' + e.id;
  }
  function move(key: string, day: string) {
    const event = events.find((e) => eventKey(e) === key);
    if (
      !event?.field ||
      event.version === undefined ||
      event.day === day ||
      pending
    )
      return;
    const form = new FormData();
    form.set('operation', 'task-date-move');
    form.set('id', event.id);
    form.set('version', String(event.version));
    form.set('day', day);
    form.set('field', event.field);
    startTransition(async () => {
      try {
        const result = await submitOperation({}, form);
        setFailed(!result.ok);
        setMessage(
          result.ok
            ? `“${event.title}” ${day} gününe taşındı.`
            : (result.message ?? 'Kaydedilemedi.'),
        );
        router.refresh();
      } catch {
        setFailed(true);
        setMessage('Bağlantı kesildi. Sayfayı yenileyip tekrar deneyin.');
      } finally {
        setDrag(null);
        setOver(null);
      }
    });
  }
  const createLink = (day: string) =>
    '/workspace/tasks?' +
    new URLSearchParams({ start: day, new: '1', ...(brand ? { brand } : {}) }) +
    '#new';
  const selectedEvents = events.filter((e) => e.day === selected);
  return (
    <>
      <p className="calendar-instructions">
        Tutamacı olan görevleri bir güne sürükleyin.{' '}
        <strong>Başlangıç taşınırsa teslim de aynı süre kadar kayar.</strong>{' '}
        Teslim kartı yalnız teslim gününü değiştirir. Telefon ve klavye için
        görev ayrıntısındaki tarih formunu kullanabilirsiniz. Ekipteki diğer
        işleri görüntülemek düzenleme yetkisi vermez.
      </p>
      <div className="calendar-legend">
        <span className="legend-dot manager">Yönetici görevi</span>
        <span className="legend-dot employee">Çalışan görevi</span>
        <span className="legend-dot personal">Kişisel</span>
      </div>
      {message && (
        <p role="status" className={failed ? 'form-error' : 'form-success'}>
          {message}
        </p>
      )}
      <div className="calendar-weekdays">
        {[
          'Pazartesi',
          'Salı',
          'Çarşamba',
          'Perşembe',
          'Cuma',
          'Cumartesi',
          'Pazar',
        ].map((d) => (
          <strong key={d}>{d}</strong>
        ))}
      </div>
      <div
        className="calendar-grid"
        aria-label="Aylık iş takvimi"
        aria-busy={pending}
      >
        {cells.map((day, index) => {
          const entries = day ? events.filter((e) => e.day === day) : [];
          return (
            <section
              key={day ?? 'blank' + index}
              data-calendar-day={day ?? undefined}
              aria-label={day ?? 'Ay dışında'}
              className={`calendar-day ${!day ? 'outside' : ''} ${day === today ? 'today' : ''} ${over === day ? 'calendar-drop-active' : ''} ${selected === day ? 'selected-day' : ''}`}
              onDragOver={(e) => {
                if (day && !pending) {
                  e.preventDefault();
                  setOver(day);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (day) move(e.dataTransfer.getData('text/plain'), day);
                setDrag(null);
                setOver(null);
              }}
            >
              {day && (
                <>
                  <div className="calendar-day-heading">
                    <button
                      type="button"
                      className="day-number"
                      onClick={() => setSelected(day)}
                      aria-pressed={selected === day}
                    >
                      <time dateTime={day}>{Number(day.slice(-2))}</time>
                      <small>
                        {entries.length ? `${entries.length} kayıt` : ''}
                      </small>
                    </button>
                    {canCreate && (
                      <Link
                        className="calendar-add-task"
                        aria-label={`${day} günü için iş ekle`}
                        href={createLink(day)}
                      >
                        ＋ İş
                      </Link>
                    )}
                  </div>
                  {entries.map((event) => (
                    <article
                      key={eventKey(event)}
                      data-status={event.status}
                      className={`calendar-event ${event.kind} ${event.employee ? 'employee-event' : ''} ${event.status === 'COMPLETED' ? 'event-completed' : ''} ${drag === eventKey(event) ? 'event-dragging' : ''}`}
                      draggable={!!event.field && !pending}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', eventKey(event));
                        setDrag(eventKey(event));
                      }}
                      onDragEnd={() => {
                        setDrag(null);
                        setOver(null);
                      }}
                    >
                      <div className="calendar-event-top">
                        <small>
                          {event.label} · {event.time}
                        </small>
                        {event.field && (
                          <span
                            className="calendar-drag-handle"
                            aria-hidden="true"
                            draggable={false}
                            onPointerDown={(e) => {
                              if (pending) return;
                              e.preventDefault();
                              e.currentTarget.setPointerCapture(e.pointerId);
                              setDrag(eventKey(event));
                            }}
                            onPointerMove={(e) => {
                              if (
                                !e.currentTarget.hasPointerCapture(e.pointerId)
                              )
                                return;
                              setOver(
                                document
                                  .elementFromPoint(e.clientX, e.clientY)
                                  ?.closest('[data-calendar-day]')
                                  ?.getAttribute('data-calendar-day') ?? null,
                              );
                            }}
                            onPointerUp={(e) => {
                              if (
                                !e.currentTarget.hasPointerCapture(e.pointerId)
                              )
                                return;
                              e.currentTarget.releasePointerCapture(
                                e.pointerId,
                              );
                              const target = document
                                .elementFromPoint(e.clientX, e.clientY)
                                ?.closest('[data-calendar-day]')
                                ?.getAttribute('data-calendar-day');
                              if (target) move(eventKey(event), target);
                              setDrag(null);
                              setOver(null);
                            }}
                            onPointerCancel={() => {
                              setDrag(null);
                              setOver(null);
                            }}
                          >
                            ⠿
                          </span>
                        )}
                      </div>
                      {event.href ? (
                        <Link href={event.href}>
                          <strong>{event.title}</strong>
                        </Link>
                      ) : (
                        <strong>{event.title}</strong>
                      )}
                      <small>
                        {event.brand}
                        {event.employee ? ' · Çalışan ekledi' : ''}
                      </small>
                      {event.status && (
                        <span className="event-status">
                          {statuses[event.status as keyof typeof statuses]}
                        </span>
                      )}
                      {event.assignees && <small>♧ {event.assignees}</small>}
                    </article>
                  ))}
                </>
              )}
            </section>
          );
        })}
      </div>
      <section className="day-agenda">
        <div className="panel-heading">
          <div>
            <h3>{selected} · Günün işleri</h3>
            <p>
              {selectedEvents.length} kayıt. Yetkili olduğunuz görevlerin
              ayrıntısından tarih ve durumu güncelleyebilirsiniz.
            </p>
          </div>
          {canCreate && (
            <Link className="button-link" href={createLink(selected)}>
              ＋ İş ekle
            </Link>
          )}
        </div>
        {selectedEvents.length ? (
          selectedEvents.map((e) => {
            const body = (
              <>
                <time>{e.time}</time>
                <div>
                  <strong>{e.title}</strong>
                  <small>
                    {e.label} · {e.brand}
                    {e.assignees ? ' · ' + e.assignees : ''}
                  </small>
                </div>
                {e.href ? (
                  <span>↗</span>
                ) : (
                  <span className="shared-calendar-label">Ekip görünümü</span>
                )}
              </>
            );
            return e.href ? (
              <Link
                className={`agenda-row ${e.employee ? 'employee-agenda' : ''}`}
                key={eventKey(e)}
                href={e.href}
              >
                {body}
              </Link>
            ) : (
              <div className="agenda-row" key={eventKey(e)}>
                {body}
              </div>
            );
          })
        ) : (
          <p>
            Bu gün için plan yok. Takvimde başka bir gün seçebilir veya yeni iş
            ekleyebilirsiniz.
          </p>
        )}
      </section>
    </>
  );
}
