import Link from 'next/link';
import { currentActor } from '@/lib/current-actor';
import { db } from '@/lib/db';
import { brandScope } from '@/services/context';
import { listContent, contentStatuses } from '@/services/content';
import { ActionForm } from '@/components/action-form';
import { displayDate, localStamp } from '@/lib/dates';
export default async function Content({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string; status?: string; q?: string }>;
}) {
  const actor = await currentActor();
  const raw = await searchParams;
  const filters = {
    ...raw,
    status:
      raw.status && Object.hasOwn(contentStatuses, raw.status)
        ? raw.status
        : undefined,
  };
  const [items, brands] = await Promise.all([
    listContent(actor, filters),
    db.brand.findMany({
      where: { ...brandScope(actor), archived: false },
      orderBy: { name: 'asc' },
    }),
  ]);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">PLANLA · ONAYLA · TAKİP ET</span>
          <h1>İçerik takibi</h1>
          <p>Marka, kanal, yayın tarihi ve onay durumunu tek yerde izleyin.</p>
        </div>
        <Link className="button-link" href="/workspace/calendar">
          Takvimde gör ↗
        </Link>
      </div>
      {actor.role === 'ADMIN' && (
        <section className="panel" id="new">
          <h2>＋ İçerik planla</h2>
          {brands.length ? (
            <ActionForm operation="content-create" label="İçeriği ekle" reset>
              <div className="form-grid">
                <label>
                  İçerik başlığı
                  <input name="title" required maxLength={200} />
                </label>
                <label>
                  Marka
                  <select name="brandId" required>
                    {brands.map((b) => (
                      <option value={b.id} key={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Kanal
                  <select name="channel">
                    {[
                      'Instagram',
                      'TikTok',
                      'LinkedIn',
                      'YouTube',
                      'Facebook',
                      'Web',
                    ].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Format
                  <select name="format">
                    {['Gönderi', 'Reels', 'Story', 'Video', 'Yazı'].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Planlanan yayın (İstanbul saati)
                  <input name="scheduledAt" type="datetime-local" />
                </label>
                <label className="span-2">
                  Metin / üretim notu
                  <textarea name="body" maxLength={10000} />
                </label>
              </div>
            </ActionForm>
          ) : (
            <p>
              İçerik planlamak için{' '}
              <Link href="/workspace/brands/new">önce bir marka ekleyin →</Link>
            </p>
          )}
        </section>
      )}
      <section className="panel">
        <form className="filters">
          <input
            name="q"
            placeholder="İçerik ara…"
            aria-label="İçerik ara"
            defaultValue={raw.q}
          />
          <select name="brand" aria-label="Marka" defaultValue={raw.brand}>
            <option value="">Tüm markalar</option>
            {brands.map((b) => (
              <option value={b.id} key={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <select
            name="status"
            aria-label="İçerik durumu"
            defaultValue={filters.status}
          >
            <option value="">Tüm durumlar</option>
            {Object.entries(contentStatuses).map(([key, label]) => (
              <option value={key} key={key}>
                {label}
              </option>
            ))}
          </select>
          <button>Filtrele</button>
        </form>
        <p>
          Son {items.length} kayıt · En fazla 100 kayıt gösterilir. Daha dar
          arama için filtreleri kullanın.
        </p>
      </section>
      <div className="content-grid">
        {items.map((item) => (
          <section className="panel content-card" key={item.id}>
            <div className="content-meta">
              <span>{item.brand.name}</span>
              <span className="status-badge">
                {contentStatuses[item.status]}
              </span>
            </div>
            <h2>{item.title}</h2>
            <p>
              {item.channel} · {item.format}
            </p>
            <p>Yayın planı: {displayDate(item.scheduledAt)}</p>
            {item.publishedAt && (
              <p>
                Yayınlandı olarak işaretlendi: {displayDate(item.publishedAt)}
              </p>
            )}
            {actor.role === 'ADMIN' && item.status !== 'PUBLISHED' && (
              <details className="disclosure">
                <summary>İçeriği düzenle</summary>
                <p>Değişiklikler onay durumunu taslağa döndürür.</p>
                <ActionForm
                  operation="content-edit"
                  label="Değişiklikleri kaydet"
                >
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="version" value={item.version} />
                  <input type="hidden" name="brandId" value={item.brandId} />
                  <label>
                    Başlık
                    <input
                      name="title"
                      required
                      maxLength={200}
                      defaultValue={item.title}
                    />
                  </label>
                  <div className="form-grid">
                    <label>
                      Kanal
                      <select name="channel" defaultValue={item.channel}>
                        {[
                          'Instagram',
                          'TikTok',
                          'LinkedIn',
                          'YouTube',
                          'Facebook',
                          'Web',
                        ].map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Format
                      <select name="format" defaultValue={item.format}>
                        {['Gönderi', 'Reels', 'Story', 'Video', 'Yazı'].map(
                          (v) => (
                            <option key={v}>{v}</option>
                          ),
                        )}
                      </select>
                    </label>
                  </div>
                  <label>
                    Planlanan yayın (İstanbul saati)
                    <input
                      name="scheduledAt"
                      type="datetime-local"
                      defaultValue={
                        item.scheduledAt ? localStamp(item.scheduledAt) : ''
                      }
                    />
                  </label>
                  <label>
                    Metin / üretim notu
                    <textarea
                      name="body"
                      maxLength={10000}
                      defaultValue={item.body}
                    />
                  </label>
                </ActionForm>
              </details>
            )}
            <p className="content-copy">
              {item.body || 'Üretim notu eklenmedi.'}
            </p>
            {actor.role === 'ADMIN' && (
              <ActionForm operation="content-status" label="Durumu kaydet">
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="version" value={item.version} />
                <label>
                  İçerik durumu
                  <select name="status" defaultValue={item.status}>
                    {Object.entries(contentStatuses).map(([key, label]) => (
                      <option value={key} key={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </ActionForm>
            )}
          </section>
        ))}
      </div>
      {!items.length && (
        <section className="panel empty-state">
          <h2>İçerik listeniz boş</h2>
          <p>
            {actor.role === 'ADMIN'
              ? 'İlk içeriği yukarıdaki formdan ekleyin veya filtreleri değiştirin.'
              : 'Size atanan markaların içerikleri burada görünecek.'}
          </p>
        </section>
      )}
      <p className="help">
        Bu alan içerik üretimini takip eder. Sosyal ağlara otomatik paylaşım
        yapmaz; “Yayınlandı” durumu yönetici tarafından kaydedilir.
      </p>
    </>
  );
}
