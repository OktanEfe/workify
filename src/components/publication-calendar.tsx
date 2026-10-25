'use client';
import Link from 'next/link';
import { useState } from 'react';
export type PublicationEvent = {
  id: string;
  title: string;
  brand: string;
  brandId: string;
  channel: string;
  format: string;
  status: string;
  statusLabel: string;
  day: string;
  time: string;
  href: string;
};
export function PublicationCalendar({
  cells,
  events,
  today,
  brand,
  channel,
}: {
  cells: (string | null)[];
  events: PublicationEvent[];
  today: string;
  brand?: string;
  channel?: string;
}) {
  const [selected, setSelected] = useState(
    cells.includes(today)
      ? today
      : (cells.find((day): day is string => !!day) ?? today),
  );
  const daily = events.filter((event) => event.day === selected);
  const add = (day: string) =>
    '/workspace/content?' +
    new URLSearchParams({
      start: day,
      new: '1',
      ...(brand ? { brand } : {}),
      ...(channel ? { channel } : {}),
    }) +
    '#new';
  function selectDay(day: string, scroll = false) {
    setSelected(day);
    if (scroll)
      document
        .getElementById('publication-day-agenda')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  return (
    <>
      <div className="publication-weekdays">
        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => (
          <strong key={day}>{day}</strong>
        ))}
      </div>
      <div className="publication-grid" aria-label="Marka paylaşım takvimi">
        {cells.map((day, i) => {
          const entries = day
            ? events.filter((event) => event.day === day)
            : [];
          return (
            <section
              aria-label={day ?? 'Ay dışında'}
              key={day ?? 'blank' + i}
              className={`publication-day ${!day ? 'outside' : ''} ${day === today ? 'today' : ''} ${day === selected ? 'selected' : ''}`}
            >
              {day && (
                <>
                  <header>
                    <button
                      type="button"
                      aria-pressed={selected === day}
                      onClick={() => selectDay(day)}
                    >
                      <time dateTime={day}>{Number(day.slice(-2))}</time>
                      {entries.length > 0 && (
                        <small>{entries.length} paylaşım</small>
                      )}
                    </button>
                    <Link
                      aria-label={`${day} için içerik ekle`}
                      href={add(day)}
                    >
                      ＋
                    </Link>
                  </header>
                  {entries.slice(0, 3).map((event) => (
                    <Link
                      className="publication-event"
                      data-channel={event.channel}
                      href={event.href}
                      key={event.id}
                    >
                      <span className="publication-event-meta">
                        <time>{event.time}</time>
                        <span>{event.channel}</span>
                      </span>
                      <strong>{event.title}</strong>
                      <small>
                        {event.brand} · {event.format}
                      </small>
                      <span
                        className="publication-status"
                        data-status={event.status}
                      >
                        {event.statusLabel}
                      </span>
                    </Link>
                  ))}
                  {entries.length > 3 && (
                    <button
                      type="button"
                      className="publication-more"
                      onClick={() => selectDay(day, true)}
                    >
                      ＋ {entries.length - 3} paylaşım daha
                    </button>
                  )}
                </>
              )}
            </section>
          );
        })}
      </div>
      <section className="publication-agenda" id="publication-day-agenda">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">GÜNÜN YAYIN AKIŞI</span>
            <h2>{selected.split('-').reverse().join('.')}</h2>
            <p>{daily.length} içerik · Saatler İstanbul saatidir.</p>
          </div>
          <Link className="button-link" href={add(selected)}>
            ＋ Bu güne içerik ekle
          </Link>
        </div>
        {daily.length ? (
          <div className="publication-agenda-list">
            {daily.map((event) => (
              <Link
                href={event.href}
                className="publication-agenda-row"
                data-channel={event.channel}
                key={event.id}
              >
                <time>{event.time}</time>
                <div>
                  <strong>{event.title}</strong>
                  <small>
                    {event.brand} · {event.channel} · {event.format}
                  </small>
                </div>
                <span className="publication-status" data-status={event.status}>
                  {event.statusLabel}
                </span>
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="publication-empty">
            <strong>Bu gün henüz boş.</strong>
            <p>Bir içerik planlayın veya takvimde başka bir günü seçin.</p>
          </div>
        )}
      </section>
    </>
  );
}
