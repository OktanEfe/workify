import Link from 'next/link';
import { currentActor } from '@/lib/current-actor';
import { db } from '@/lib/db';
import { formOptions } from '@/services/queries';
import { taskScope, brandScope } from '@/services/context';
import { ActionForm } from '@/components/action-form';
import { projectStatuses } from '@/lib/labels';
import { displayDate } from '@/lib/dates';
export default async function Projects() {
  const actor = await currentActor();
  const [options, projects] = await Promise.all([
    formOptions(actor),
    db.project.findMany({
      where: { organizationId: actor.organizationId, brand: brandScope(actor) },
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        brand: { select: { name: true } },
        tasks: { where: taskScope(actor), select: { status: true } },
      },
    }),
  ]);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">MARKADAN TESLİME</span>
          <h1>Projeler</h1>
          <p>Aynı hedefe çalışan işleri bir araya getirin.</p>
        </div>
      </div>
      {actor.role === 'ADMIN' && (
        <details className="panel disclosure">
          <summary>＋ Yeni proje</summary>
          <ActionForm operation="project-create" label="Projeyi oluştur" reset>
            <div className="form-grid">
              <label>
                Proje adı
                <input name="name" required maxLength={200} />
              </label>
              <label>
                Marka
                <select name="brandId" required>
                  {options.brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Teslim tarihi
                <input name="dueAt" type="datetime-local" />
              </label>
              <label className="span-2">
                Açıklama
                <textarea name="description" maxLength={5000} />
              </label>
            </div>
          </ActionForm>
        </details>
      )}
      <div className="brand-grid">
        {projects.map((project) => {
          const completed = project.tasks.filter(
            (t) => t.status === 'COMPLETED',
          ).length;
          return (
            <section key={project.id} className="panel project-card">
              <span className="eyebrow">{project.brand.name}</span>
              <h2>{project.name}</h2>
              <p className="pre-wrap">
                {project.description || 'Açıklama eklenmedi.'}
              </p>
              <small>Teslim: {displayDate(project.dueAt)}</small>
              <div className="progress-track">
                <span
                  style={{
                    width: `${project.tasks.length ? (completed / project.tasks.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <p>
                {completed} / {project.tasks.length} görev tamamlandı
              </p>
              {actor.role === 'ADMIN' ? (
                <ActionForm
                  operation="project-status"
                  label="Durumu kaydet"
                  className="compact-form"
                >
                  <input type="hidden" name="id" value={project.id} />
                  <select
                    aria-label={`${project.name} durumu`}
                    name="status"
                    defaultValue={project.status}
                  >
                    {Object.entries(projectStatuses).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </ActionForm>
              ) : (
                <p>
                  {
                    projectStatuses[
                      project.status as keyof typeof projectStatuses
                    ]
                  }
                </p>
              )}
              <Link href={`/workspace/brands/${project.brandId}`}>
                Marka çalışma alanı →
              </Link>
            </section>
          );
        })}
      </div>
      {!projects.length && (
        <section className="panel empty-state">
          <h3>Henüz proje yok</h3>
          <p>
            Bir markanın kampanya veya aylık çalışmalarını proje altında
            toplayın.
          </p>
        </section>
      )}
    </>
  );
}
