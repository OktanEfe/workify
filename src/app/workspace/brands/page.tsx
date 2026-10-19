import Link from 'next/link';
import { currentActor } from '@/lib/current-actor';
import { db } from '@/lib/db';
import { brandScope } from '@/services/context';
export default async function Brands({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const actor = await currentActor();
  const { q = '' } = await searchParams;
  const brands = await db.brand.findMany({
    where: {
      ...brandScope(actor),
      ...(q
        ? { name: { contains: q.slice(0, 100), mode: 'insensitive' } }
        : {}),
    },
    orderBy: [{ archived: 'asc' }, { name: 'asc' }],
    take: 200,
    include: {
      _count: {
        select: { members: true, tasks: { where: { deletedAt: null } } },
      },
    },
  });
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">MÜŞTERİ OPERASYONLARI</span>
          <h1>Markalar</h1>
          <p>Her müşterinin işlerini ve ekibini bir arada yönetin.</p>
        </div>
        <form className="filter-search">
          <input
            aria-label="Marka ara"
            name="q"
            defaultValue={q}
            placeholder="Marka ara…"
          />
          <button>Ara</button>
        </form>
      </div>
      {actor.role === 'ADMIN' && (
        <div className="brand-create-bar">
          <p>
            Yeni müşterinizin bilgilerini ekleyin, ardından ekibini ve
            görevlerini belirleyin.
          </p>
          <Link className="button-link" href="/workspace/brands/new">
            ＋ Marka ekle
          </Link>
        </div>
      )}
      <div className="brand-grid">
        {brands.map((brand) => (
          <Link
            href={`/workspace/brands/${brand.id}`}
            className="brand-card"
            key={brand.id}
          >
            <div>
              <span className="brand-initial">{brand.name.charAt(0)}</span>
              <span className={`status-badge ${brand.archived ? 'muted' : ''}`}>
                {brand.archived ? 'Arşiv' : 'Aktif'}
              </span>
            </div>
            <h2>{brand.name}</h2>
            <p>{brand.sector || 'Müşteri markası'}</p>
            <div className="brand-card-footer">
              <span>{brand._count.tasks} görev</span>
              <span>{brand._count.members} ekip üyesi ↗</span>
            </div>
          </Link>
        ))}
      </div>
      {!brands.length && (
        <div className="panel empty-state">
          <h3>
            {q ? 'Aramanızla eşleşen marka yok' : 'Marka listeniz henüz boş'}
          </h3>
          <p>
            {actor.role === 'ADMIN'
              ? 'İlk müşterinizi ekleyerek başlayın.'
              : 'Yöneticiniz size marka atadığında burada görünecek.'}
          </p>
        </div>
      )}
    </>
  );
}
