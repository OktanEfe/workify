import Link from 'next/link';
import { notFound } from 'next/navigation';
import { currentActor } from '@/lib/current-actor';
import { brandDetail } from '@/services/operations';
import { taskScope } from '@/services/context';
import { db } from '@/lib/db';
import { ActionForm } from '@/components/action-form';
import { BrandFields } from '@/components/brand-fields';
import { statuses } from '@/lib/labels';
export default async function BrandDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await currentActor();
  const brand = await brandDetail(actor, id);
  if (!brand) notFound();
  const [members, tasks] = await Promise.all([
    actor.role === 'ADMIN'
      ? db.membership.findMany({
          where: { organizationId: actor.organizationId, active: true },
          include: { user: { select: { name: true } } },
          take: 200,
        })
      : Promise.resolve([]),
    db.task.findMany({
      where: { ...taskScope(actor), brandId: id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
  ]);
  return (
    <>
      <Link className="back-link" href="/workspace/brands">
        ← Markalar
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">MARKA ÇALIŞMA ALANI</span>
          <h1>{brand.name}</h1>
          <p>
            {brand.sector || 'Müşteri markası'} ·{' '}
            {brand.archived ? 'Arşivlendi' : 'Aktif'}
          </p>
        </div>
        <Link className="button-link secondary" href="/workspace/tasks#new">
          Görev oluştur ↗
        </Link>
      </div>
      <div className="section-tabs">
        <a href="#overview">Genel bakış</a>
        <Link href={'/workspace/brand-calendar?brand=' + id}>
          Paylaşım takvimi
        </Link>
        {!brand.archived && (
          <Link href={'/workspace/brands/' + id + '/studio'}>
            Marka kimliği & tasarım
          </Link>
        )}
        <Link href={'/workspace/content?brand=' + id}>İçerikler</Link>
        <a href="#tasks">Görevler</a>
        <a href="#projects">Projeler</a>
        <a href="#team">Ekip</a>
      </div>
      <div className="dashboard-columns">
        <section id="overview" className="panel">
          <div className="panel-heading">
            <h2>Marka bilgileri</h2>
          </div>
          {actor.role === 'ADMIN' ? (
            <ActionForm operation="brand-save" label="Değişiklikleri kaydet">
              <input name="id" type="hidden" value={brand.id} />
              <input name="version" type="hidden" value={brand.version} />
              <BrandFields brand={brand} />
            </ActionForm>
          ) : (
            <>
              <p className="pre-wrap">
                {brand.description || 'Açıklama eklenmedi.'}
              </p>
              <dl className="detail-list">
                <dt>İletişim</dt>
                <dd>{brand.contactName || 'Belirlenmedi'}</dd>
                <dt>E-posta</dt>
                <dd>{brand.email || 'Belirlenmedi'}</dd>
                <dt>Web sitesi</dt>
                <dd>{brand.website || 'Belirlenmedi'}</dd>
              </dl>
            </>
          )}
          {actor.role === 'ADMIN' && (
            <div className="danger-zone">
              <ActionForm
                operation="brand-archive"
                label={
                  brand.archived
                    ? 'Markayı yeniden etkinleştir'
                    : 'Markayı arşivle'
                }
              >
                <input type="hidden" name="id" value={brand.id} />
              </ActionForm>
              <small>Arşivleme verileri ve geçmişi korur.</small>
            </div>
          )}
        </section>
        <section id="team" className="panel">
          <div className="panel-heading">
            <div>
              <h2>Marka ekibi</h2>
              <p>Markadan çıkarılan kişinin erişimi kaldırılır.</p>
            </div>
          </div>
          {actor.role === 'ADMIN'
            ? members.map((member) => {
                const assigned = brand.members.some(
                  (m) => m.membershipId === member.id,
                );
                return (
                  <div className="member-line" key={member.id}>
                    <div>
                      <strong>{member.user.name}</strong>
                      <small>{member.jobTitle || 'Ekip üyesi'}</small>
                    </div>
                    <ActionForm
                      operation="brand-member"
                      label={assigned ? 'Çıkar' : 'Ata'}
                      className="compact-form"
                    >
                      <input type="hidden" name="id" value={brand.id} />
                      <input
                        type="hidden"
                        name="membershipId"
                        value={member.id}
                      />
                      <input
                        type="hidden"
                        name="assigned"
                        value={String(!assigned)}
                      />
                    </ActionForm>
                  </div>
                );
              })
            : brand.members.map((m) => (
                <p key={m.membershipId}>{m.membership.user.name}</p>
              ))}
        </section>
      </div>
      <section className="panel" id="tasks">
        <div className="panel-heading">
          <h2>Marka görevleri</h2>
          <Link href={`/workspace/tasks?brand=${id}`}>Tümünü filtrele ↗</Link>
        </div>
        {tasks.length ? (
          <div className="task-summary">
            {tasks.map((task) => (
              <Link key={task.id} href={`/workspace/tasks/${task.id}`}>
                <strong>{task.title}</strong>
                <span className="status-badge">{statuses[task.status]}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p>Bu markada size açık görev bulunmuyor.</p>
        )}
      </section>
      <section className="panel" id="projects">
        <div className="panel-heading">
          <h2>Projeler</h2>
          <Link href="/workspace/projects">Projelere git ↗</Link>
        </div>
        {brand.projects.length ? (
          brand.projects.map((project) => (
            <p key={project.id}>{project.name}</p>
          ))
        ) : (
          <p>Henüz proje eklenmedi.</p>
        )}
      </section>
    </>
  );
}
