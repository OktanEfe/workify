import Link from 'next/link';
import { notFound } from 'next/navigation';
import { currentActor } from '@/lib/current-actor';
import { AccessDenied } from '@/lib/access';
import { brandCreativeBrief } from '@/services/brand-planning';
import { listContent, contentStatuses } from '@/services/content';
import { ActionForm } from '@/components/action-form';
export default async function BrandStudio({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await currentActor();
  const { id } = await params;
  const brand = await brandCreativeBrief(actor, id).catch((error) => {
    if (error instanceof AccessDenied) notFound();
    throw error;
  });
  const contents = (await listContent(actor, { brand: id })).slice(0, 6);
  const swatches = brand.palette
    .split(/[\s,;]+/)
    .filter((value) => /^#[0-9a-f]{6}$/i.test(value))
    .slice(0, 8);
  return (
    <>
      <Link className="back-link" href={`/workspace/brands/${id}`}>
        ← {brand.name}
      </Link>
      <div className="publication-hero brand-studio-hero">
        <div>
          <span className="eyebrow">MARKANIN YARATICI HAFIZASI</span>
          <h1>{brand.name}</h1>
          <p>Marka kimliği, görsel dil ve yapacağımız tasarımlar.</p>
          <div className="calendar-view-links">
            <Link href={'/workspace/brand-calendar?brand=' + id}>
              Paylaşım takvimi ↗
            </Link>
            <Link href={'/workspace/content?brand=' + id}>İçerikler ↗</Link>
          </div>
        </div>
        <span className="studio-monogram">{brand.name.slice(0, 1)}</span>
      </div>
      <section className="panel creative-overview">
        <div>
          <span className="eyebrow">RENK PALETİ</span>
          <div className="brand-swatches">
            {swatches.length ? (
              swatches.map((color, i) => (
                <span key={color + i}>
                  <i style={{ backgroundColor: color }} />
                  {color}
                </span>
              ))
            ) : (
              <p>Renk kodları henüz eklenmedi.</p>
            )}
          </div>
        </div>
        <div>
          <span className="eyebrow">TİPOGRAFİ</span>
          <p>
            {brand.typography || 'Yazı tipi tercihlerinizi aşağıya ekleyin.'}
          </p>
        </div>
        <div>
          <span className="eyebrow">MARKA DOSYALARI</span>
          {brand.assetLinks.length ? (
            <div className="brand-asset-links">
              {brand.assetLinks.map((url, i) => (
                <a
                  href={url}
                  key={url + i}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {new URL(url).hostname} ↗
                </a>
              ))}
            </div>
          ) : (
            <p>Logo, kılavuz veya tasarım klasörü bağlantıları ekleyin.</p>
          )}
        </div>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">MARKANIN İÇERİK HAFIZASI</span>
            <h2>İçerikler ve üretim fikirleri</h2>
            <p>
              En yeni {contents.length} içerik. Tüm kayıtlar içerik stüdyosunda.
            </p>
          </div>
          <Link
            className="button-link"
            href={'/workspace/content?brand=' + id + '&new=1#new'}
          >
            ＋ İçerik ekle
          </Link>
        </div>
        {contents.length ? (
          <div className="brand-content-summary">
            {contents.map((item) => (
              <Link
                key={item.id}
                href={
                  '/workspace/content?brand=' +
                  id +
                  '&item=' +
                  item.id +
                  '#content-' +
                  item.id
                }
                data-channel={item.channel}
              >
                <span>
                  {item.channel} · {item.format}
                </span>
                <strong>{item.title}</strong>
                <small>{contentStatuses[item.status]}</small>
              </Link>
            ))}
          </div>
        ) : (
          <p>Bu markaya ait ilk içeriği ekleyerek başlayabilirsiniz.</p>
        )}
      </section>
      <section className="panel brand-creative-form">
        <div className="panel-heading">
          <div>
            <h2>Marka kimliği ve tasarım planı</h2>
            <p>
              Ekip aynı yaratıcı yönü takip etsin. Tüm alanlar isteğe bağlıdır;
              kaydetmeden değişiklik yapılmaz.
            </p>
          </div>
        </div>
        <ActionForm operation="brand-identity" label="Marka notlarını kaydet">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="version" value={brand.version} />
          <div className="form-grid">
            <label className="span-2">
              Marka kimliği / hikâyesi
              <textarea
                name="brandIdentity"
                maxLength={5000}
                defaultValue={brand.brandIdentity}
                placeholder="Marka neyi temsil ediyor? Değerleri, farkı ve vaadi nedir?"
              />
            </label>
            <label>
              Hedef kitle
              <textarea
                name="targetAudience"
                maxLength={3000}
                defaultValue={brand.targetAudience}
                placeholder="Kime konuşuyoruz? İhtiyaçları ve beklentileri neler?"
              />
            </label>
            <label>
              İletişim dili
              <textarea
                name="toneOfVoice"
                maxLength={3000}
                defaultValue={brand.toneOfVoice}
                placeholder="Samimi, uzman, enerjik… Kullanılacak ve kaçınılacak ifadeler."
              />
            </label>
            <label>
              Renk paleti
              <input
                name="palette"
                maxLength={300}
                defaultValue={brand.palette}
                placeholder="#142447 #4164FF #FFF8EC"
              />
              <small>
                Önizleme için 6 haneli HEX kodlarını boşlukla ayırın.
              </small>
            </label>
            <label>
              Yazı tipi / tipografi
              <input
                name="typography"
                maxLength={300}
                defaultValue={brand.typography}
                placeholder="Başlık ve gövde yazı tipi, punto ve kullanım notları"
              />
            </label>
            <label className="span-2">
              Görsel dil ve yaratıcı yön
              <textarea
                name="visualDirection"
                maxLength={5000}
                defaultValue={brand.visualDirection}
                placeholder="Fotoğraf, ışık, kompozisyon, grid, ikon ve video yaklaşımımız."
              />
            </label>
            <label className="span-2">
              Neler tasarlayacağız? / üretim planı
              <textarea
                name="designPlan"
                maxLength={8000}
                defaultValue={brand.designPlan}
                placeholder="Yapılacak tasarımlar, seri fikirleri, teslimler ve dikkat edilecek noktalar."
              />
            </label>
            <label className="span-2">
              Logo, marka kılavuzu ve tasarım klasörleri
              <textarea
                name="assetLinks"
                maxLength={20000}
                defaultValue={brand.assetLinks.join('\n')}
                placeholder="Her satıra bir HTTPS bağlantısı; en fazla 10."
              />
              <small>
                Özel dosyaların kendisini değil, erişim izinlerini yönettiğiniz
                klasör bağlantılarını kaydedin.
              </small>
            </label>
          </div>
        </ActionForm>
      </section>
    </>
  );
}
