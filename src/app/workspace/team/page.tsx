import { notFound } from 'next/navigation';
import { currentActor } from '@/lib/current-actor';
import { team } from '@/services/queries';
import { ActionForm } from '@/components/action-form';
export default async function Team() {
  const actor = await currentActor();
  if (actor.role !== 'ADMIN') notFound();
  const members = await team(actor);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">BİRLİKTE ÜRETİYORUZ</span>
          <h1>Çalışanlar</h1>
          <p>
            Ekip yetkilerini, marka atamalarını ve tahmini iş yükünü yönetin.
          </p>
        </div>
        <span className="metric-chip">
          {members.filter((m) => m.active).length} aktif üye
        </span>
      </div>
      <div className="team-grid">
        {members.map((member) => {
          const open = member.assignments.filter(
            (a) => !['COMPLETED', 'CANCELLED'].includes(a.task.status),
          );
          const overdue = open.filter(
            (a) => a.task.dueAt && a.task.dueAt < new Date(),
          );
          return (
            <section className="panel" key={member.id}>
              <div className="member-title">
                <span className="avatar large">
                  {member.user.name.charAt(0)}
                </span>
                <div>
                  <h2>{member.user.name}</h2>
                  <p>{member.user.email}</p>
                </div>
              </div>
              <div className="mini-stats">
                <div>
                  <strong>{open.length}</strong>
                  <small>Açık görev</small>
                </div>
                <div>
                  <strong>{overdue.length}</strong>
                  <small>Geciken</small>
                </div>
                <div>
                  <strong>
                    {open.reduce((n, a) => n + a.task.estimatedMinutes, 0)}
                  </strong>
                  <small>Tahmini dakika</small>
                </div>
              </div>
              <p className="brand-tags">
                {member.brands.map((b) => (
                  <span key={b.brandId}>{b.brand.name}</span>
                ))}
                {!member.brands.length && 'Marka ataması yok'}
              </p>
              <ActionForm operation="member-update" label="Erişimi kaydet">
                <input type="hidden" name="id" value={member.id} />
                <label>
                  İş unvanı
                  <input
                    name="jobTitle"
                    maxLength={100}
                    defaultValue={member.jobTitle}
                    placeholder="Örn. Video editörü"
                  />
                </label>
                <div className="form-grid">
                  <label>
                    Sistem rolü
                    <select name="role" defaultValue={member.role}>
                      <option value="EMPLOYEE">Çalışan</option>
                      <option value="ADMIN">Yönetici</option>
                    </select>
                  </label>
                  <label>
                    Hesap erişimi
                    <select name="active" defaultValue={String(member.active)}>
                      <option value="true">Aktif</option>
                      <option value="false">Pasif</option>
                    </select>
                  </label>
                </div>
              </ActionForm>
            </section>
          );
        })}
      </div>
    </>
  );
}
