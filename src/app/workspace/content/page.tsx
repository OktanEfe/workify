import Link from 'next/link';
import { ContentImport } from '@/components/content-import';
import { WebExamples } from '@/components/web-examples';
import {
  productionIdeas,
  relatedExamples,
  keywords,
} from '@/lib/content-ideas';
import { suggestedSearch } from '@/services/content-inspiration';
import { currentActor } from '@/lib/current-actor';
import { db } from '@/lib/db';
import { brandScope } from '@/services/context';
import { listContent, contentStatuses } from '@/services/content';
import { ActionForm } from '@/components/action-form';
import { displayDate, localStamp, startFromCalendar } from '@/lib/dates';
export default async function Content({
  searchParams,
}: {
  searchParams: Promise<{
    brand?: string;
    status?: string;
    q?: string;
    idea?: string;
    item?: string;
    start?: string;
    new?: string;
    channel?: string;
  }>;
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
  const selected = items.find((item) => item.id === raw.idea) ?? items[0];
  const related = selected ? relatedExamples(selected, items) : [];
  const studioHref = (id: string) =>
    '/workspace/content?' +
    new URLSearchParams({ ...raw, idea: id }) +
    '#inspiration';
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">PLANLA · ONAYLA · TAKİP ET</span>
          <h1>İçerik stüdyosu</h1>
          <p>
            Fikirleri toplayın, örneklerle zenginleştirin ve üretime hazır hale
            getirin.
          </p>
        </div>
        <Link className="button-link" href={selected ? '#inspiration' : '#new'}>
          Örnekleri keşfet ↗
        </Link>
      </div>
      <div className="studio-shortcuts">
        <Link
          href={
            '/workspace/brand-calendar' +
            (raw.brand ? '?brand=' + encodeURIComponent(raw.brand) : '')
          }
        >
          ◷ Marka paylaşım takvimi
        </Link>
        <span>
          Eklenen içerikler taslak olarak kaydedilir; yayın onayı yöneticidedir.
        </span>
      </div>
      <div className="content-studio-intro">
        <div>
          <span>01</span>
          <strong>Fikir havuzu</strong>
          <p>Excel tablonuzu aktarın veya yeni fikir ekleyin.</p>
        </div>
        <div>
          <span>02</span>
          <strong>Örnek arşivi</strong>
          <p>İlham veren linkleri ve neyi beğendiğinizi kaydedin.</p>
        </div>
        <div>
          <span>03</span>
          <strong>Bunlara da bak!</strong>
          <p>İlişkili örnekleri keşfedin, üretim akışını netleştirin.</p>
        </div>
      </div>
      <ContentImport
        key={raw.brand ?? 'all'}
        initialBrandId={raw.brand}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
      />
      <section className="panel" id="new">
        <h2>＋ İçerik planla</h2>
        {brands.length ? (
          <ActionForm
            key={(raw.brand ?? '') + (raw.start ?? '') + (raw.channel ?? '')}
            operation="content-create"
            label="İçeriği ekle"
            reset
          >
            <div className="form-grid">
              <label>
                İçerik başlığı
                <input name="title" required maxLength={200} />
              </label>
              <label>
                Marka
                <select
                  name="brandId"
                  required
                  defaultValue={
                    brands.some((b) => b.id === raw.brand)
                      ? raw.brand
                      : undefined
                  }
                >
                  {brands.map((b) => (
                    <option value={b.id} key={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Kanal
                <select
                  name="channel"
                  defaultValue={
                    [
                      'Instagram',
                      'TikTok',
                      'LinkedIn',
                      'YouTube',
                      'Facebook',
                      'Web',
                    ].includes(raw.channel ?? '')
                      ? raw.channel
                      : 'Instagram'
                  }
                >
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
                <input
                  name="scheduledAt"
                  type="datetime-local"
                  defaultValue={startFromCalendar(raw.start)}
                />
              </label>
              <label className="span-2">
                Örnek içerik bağlantıları
                <textarea
                  name="referenceLinks"
                  maxLength={20000}
                  placeholder="Her satıra bir HTTPS bağlantısı. Instagram, TikTok, YouTube veya başka bir örnek."
                />
                <small>
                  En fazla 10 bağlantı. Üretim notunda örnekte neyi
                  beğendiğinizi anlatın.
                </small>
              </label>
              <label className="span-2">
                Metin / üretim notu
                <textarea name="body" maxLength={10000} />
              </label>
            </div>
          </ActionForm>
        ) : (
          <p>
            {actor.role === 'ADMIN' ? (
              <Link href="/workspace/brands/new">Önce bir marka ekleyin →</Link>
            ) : (
              'İçerik eklemek için yöneticiniz sizi bir markaya atamalı.'
            )}
          </p>
        )}
      </section>
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
          <section
            className="panel content-card"
            key={item.id}
            id={'content-' + item.id}
          >
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
                    Örnek içerik bağlantıları
                    <textarea
                      name="referenceLinks"
                      maxLength={20000}
                      defaultValue={item.referenceLinks.join('\n')}
                    />
                    <small>Her satıra bir HTTPS bağlantısı; en fazla 10.</small>
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
            {item.referenceLinks.length > 0 && (
              <div className="content-references">
                <strong>İlham bağlantıları</strong>
                {item.referenceLinks.map((url, i) => (
                  <a
                    key={url + i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {i + 1}. {new URL(url).hostname} ↗
                  </a>
                ))}
              </div>
            )}
            <Link className="inspiration-jump" href={studioHref(item.id)}>
              Bu fikir için örneklere bak ↗
            </Link>
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
      {selected && (
        <section className="panel inspiration-studio" id="inspiration">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">İLHAMDAN ÜRETİME</span>
              <h2>Bunlara da bak!</h2>
              <p>Konu, kanal ve format üzerinden örnekleri eşleştirin.</p>
            </div>
          </div>
          <form className="filters">
            <input type="hidden" name="brand" value={raw.brand ?? ''} />
            <label>
              Hangi fikri geliştirelim?
              <select key={selected.id} name="idea" defaultValue={selected.id}>
                {items.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.brand.name} · {item.title}
                  </option>
                ))}
              </select>
            </label>
            <button>Fikri incele</button>
          </form>
          <div className="inspiration-focus">
            <span className="status-badge">
              {selected.channel} · {selected.format}
            </span>
            <h3>{selected.title}</h3>
            <p>
              {selected.body ||
                'Daha ilgili öneriler için içeriğe hedef kitle, konu ve örnekte beğendiğiniz ayrıntıları ekleyin.'}
            </p>
            <div className="keyword-chips">
              {keywords(selected.title + ' ' + selected.body)
                .slice(0, 8)
                .map((word) => (
                  <span key={word}>{word}</span>
                ))}
            </div>
          </div>
          <h3>Markanın arşivinden ilgili örnekler</h3>
          {related.length ? (
            <div className="example-grid">
              {related.map((item) => (
                <article className="example-card" key={item.id}>
                  <span className="eyebrow">KENDİ ARŞİVİNİZDEN</span>
                  <h4>{item.title}</h4>
                  <p>{item.reason}</p>
                  {item.referenceLinks
                    .filter((url) => !selected.referenceLinks.includes(url))
                    .slice(0, 3)
                    .map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {new URL(url).hostname} ↗
                      </a>
                    ))}
                </article>
              ))}
            </div>
          ) : (
            <p className="help">
              Bu marka için henüz ilişkili bir örnek yok. İçeriklere açıklama ve
              örnek linkleri ekledikçe bu alan gelişir.
            </p>
          )}
          <h3>Bu fikri nasıl içeriğe dönüştürebiliriz?</h3>
          <p className="help">
            Aşağıdaki üretim taslakları, girdiğiniz konu ve formata göre
            kurallarla hazırlanır; video izlenerek üretilmiş analiz değildir.
          </p>
          <div className="production-grid">
            {productionIdeas(selected).map((idea) => (
              <article className="production-card" key={idea.title}>
                <h4>{idea.title}</h4>
                <strong>İlk sahne</strong>
                <p>{idea.hook}</p>
                <strong>Akış</strong>
                <p>{idea.flow}</p>
                <strong>Kapanış</strong>
                <p>{idea.cta}</p>
              </article>
            ))}
          </div>
          <WebExamples
            key={selected.id}
            id={selected.id}
            initialQuery={suggestedSearch(selected)}
            configured={!!process.env.TAVILY_API_KEY}
            referenceCount={selected.referenceLinks.length}
          />
        </section>
      )}
      {!items.length && (
        <section className="panel empty-state">
          <h2>İçerik listeniz boş</h2>
          <p>
            {actor.role === 'ADMIN'
              ? 'İlk içeriği yukarıdaki formdan ekleyin veya filtreleri değiştirin.'
              : 'Yetkili olduğunuz markaya yukarıdaki formdan içerik ekleyebilirsiniz.'}
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
