import Link from 'next/link';
import { currentActor } from '@/lib/current-actor';
import { calendarMonth } from '@/lib/calendar';
import { localStamp } from '@/lib/dates';
import { db } from '@/lib/db';
import { brandScope } from '@/services/context';
import { brandPublications, channels } from '@/services/brand-planning';
import { contentStatuses } from '@/services/content';
import { MonthNavigation } from '@/components/month-navigation';
import { PublicationCalendar } from '@/components/publication-calendar';
export default async function BrandCalendar({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; brand?: string; channel?: string }>;
}) {
  const actor = await currentActor();
  const params = await searchParams;
  const month = calendarMonth(params.month);
  const [data, brands] = await Promise.all([
    brandPublications(actor, month.start, month.end, params),
    db.brand.findMany({
      where: { ...brandScope(actor), archived: false },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);
  const selected = brands.find((brand) => brand.id === params.brand);
  const contentLink = (id: string, brandId: string) =>
    '/workspace/content?' +
    new URLSearchParams({ item: id, brand: brandId }) +
    '#content-' +
    id;
  return (
    <>
      <div className="publication-hero">
        <div>
          <span className="eyebrow">MARKA · KANAL · YAYIN ZAMANI</span>
          <h1>Marka paylaşım takvimi</h1>
          <p>
            {selected
              ? selected.name + ' için yayın akışı'
              : 'Markaların nerede, ne zaman, ne paylaşacağını tek bakışta görün.'}
          </p>
          <div className="calendar-view-links">
            <Link href="/workspace/calendar">Görev takvimi ↗</Link>
            <Link href="/workspace/calendar?view=mine">Benim takvimim ↗</Link>
            {selected && (
              <Link href={`/workspace/brands/${selected.id}/studio`}>
                Marka kimliği ↗
              </Link>
            )}
          </div>
        </div>
        <Link
          className="button-link"
          href={
            '/workspace/content?' +
            new URLSearchParams({
              new: '1',
              ...(selected ? { brand: selected.id } : {}),
            }) +
            '#new'
          }
        >
          ＋ İçerik planla
        </Link>
      </div>
      <section className="publication-metrics" aria-label="Yayın özeti">
        {[
          {
            label: 'Takvimdeki içerik',
            value: data.items.length,
            tone: 'blue',
          },
          {
            label: 'Onay bekleyen',
            value: data.items.filter((item) =>
              ['DRAFT', 'IN_REVIEW', 'REVISION'].includes(item.status),
            ).length,
            tone: 'amber',
          },
          {
            label: 'Yayınlandı',
            value: data.items.filter((item) => item.status === 'PUBLISHED')
              .length,
            tone: 'mint',
          },
          {
            label: 'Tarihi belirlenmeyen',
            value: data.unscheduledCount,
            tone: 'pink',
          },
        ].map((stat) => (
          <div key={stat.label} data-tone={stat.tone}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </div>
        ))}
      </section>
      <section className="panel publication-surface">
        <MonthNavigation
          month={month.key}
          previous={month.previous}
          next={month.next}
          basePath="/workspace/brand-calendar"
          brand={params.brand}
          filters={params.channel ? { channel: params.channel } : {}}
        />
        <form
          className="filters publication-filters"
          key={month.key + (params.brand ?? '') + (params.channel ?? '')}
        >
          <input type="hidden" name="month" value={month.key} />
          <label>
            Marka
            <select name="brand" defaultValue={params.brand ?? ''}>
              <option value="">Tüm markalarım</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Nerede paylaşılacak?
            <select name="channel" defaultValue={params.channel ?? ''}>
              <option value="">Tüm kanallar</option>
              {channels.map((channel) => (
                <option key={channel}>{channel}</option>
              ))}
            </select>
          </label>
          <button>Takvimi göster</button>
        </form>
        <div className="publication-legend">
          {channels.map((channel) => (
            <span key={channel} data-channel={channel}>
              {channel}
            </span>
          ))}
        </div>
        <p className="help">
          Gün seçerek yayın sırasını görün; ＋ ile o güne içerik ekleyin.
          Taslakların tarihi görünebilir; yayın onayı ve otomatik sosyal medya
          paylaşımı anlamına gelmez.
        </p>
        {data.items.length === 500 && (
          <p role="status">
            En fazla 500 içerik gösterilir. Marka veya kanal filtresiyle
            daraltın.
          </p>
        )}
        {brands.length ? (
          <PublicationCalendar
            key={month.key + (params.brand ?? '') + (params.channel ?? '')}
            cells={month.cells}
            events={data.items.map((item) => ({
              id: item.id,
              title: item.title,
              brand: item.brand.name,
              brandId: item.brandId,
              channel: item.channel,
              format: item.format,
              status: item.status,
              statusLabel: contentStatuses[item.status],
              day: localStamp(item.scheduledAt!).slice(0, 10),
              time: localStamp(item.scheduledAt!).slice(11),
              href: contentLink(item.id, item.brandId),
            }))}
            today={localStamp(new Date()).slice(0, 10)}
            brand={params.brand}
            channel={params.channel}
          />
        ) : (
          <div className="publication-empty">
            <h2>Henüz erişilebilir marka yok</h2>
            <p>
              {actor.role === 'ADMIN'
                ? 'Marka ekleyerek yayın takviminizi oluşturun.'
                : 'Yöneticiniz sizi bir markaya atadığında içerik ekleyebilirsiniz.'}
            </p>
          </div>
        )}
      </section>
      {data.unscheduledCount > 0 && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">FİKİRDEN YAYINA</span>
              <h2>Tarih bekleyen içerikler</h2>
              <p>
                {data.unscheduledCount} içerikten en yeni{' '}
                {data.unscheduled.length} kayıt.
              </p>
            </div>
            <Link
              href={
                '/workspace/content' +
                (params.brand
                  ? '?brand=' + encodeURIComponent(params.brand)
                  : '')
              }
            >
              İçerik stüdyosuna git ↗
            </Link>
          </div>
          <div className="unscheduled-grid">
            {data.unscheduled.map((item) => (
              <Link
                href={contentLink(item.id, item.brandId)}
                key={item.id}
                data-channel={item.channel}
              >
                <span>
                  {item.channel} · {item.format}
                </span>
                <strong>{item.title}</strong>
                <small>
                  {item.brand.name} · {contentStatuses[item.status]}
                </small>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
