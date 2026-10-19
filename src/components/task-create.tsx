'use client';
import { useState } from 'react';
import { ActionForm } from './action-form';
import { priorities } from '@/lib/labels';
export function TaskCreate({
  brands,
  projects,
  members,
  admin,
  task,
}: {
  brands: { id: string; name: string; memberIds: string[] }[];
  projects: { id: string; brandId: string; name: string }[];
  members: { id: string; name: string }[];
  admin: boolean;
  task?: {
    id: string;
    version: number;
    brandId: string;
    title: string;
    description: string;
    projectId: string;
    priority: string;
    dueAt: string;
    estimatedMinutes: number;
    assigneeIds: string[];
  };
}) {
  const [brandId, setBrandId] = useState(task?.brandId ?? brands[0]?.id ?? '');
  const brand = brands.find((b) => b.id === brandId);
  return (
    <ActionForm
      operation={task ? 'task-edit' : 'task-create'}
      label={task ? 'Değişiklikleri kaydet' : 'Görevi oluştur'}
      reset={!task}
    >
      {task && (
        <>
          <input type="hidden" name="id" value={task.id} />
          <input type="hidden" name="version" value={task.version} />
        </>
      )}
      <div className="form-grid">
        <label className="span-2">
          Görev başlığı
          <input
            defaultValue={task?.title}
            name="title"
            required
            maxLength={200}
            placeholder="Örn. Ekim kampanyası için Reels hazırla"
          />
        </label>
        <label>
          Marka
          <select
            name="brandId"
            required
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
          >
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Proje
          <select
            key={brandId}
            name="projectId"
            defaultValue={task?.projectId ?? ''}
          >
            <option value="">Projesiz görev</option>
            {projects
              .filter((p) => p.brandId === brandId)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Öncelik
          <select name="priority" defaultValue={task?.priority ?? 'MEDIUM'}>
            {Object.entries(priorities).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Teslim tarihi ve saati
          <input
            name="dueAt"
            type="datetime-local"
            defaultValue={task?.dueAt ?? ''}
          />
          <small>İstanbul saati</small>
        </label>
        <label>
          Tahmini süre (dakika)
          <input
            name="estimatedMinutes"
            type="number"
            min={0}
            max={600000}
            step={1}
            defaultValue={task?.estimatedMinutes ?? 0}
          />
        </label>
        <div>
          <label>Sorumlular</label>
          {admin ? (
            <div className="checkbox-list">
              {members
                .filter((m) => brand?.memberIds.includes(m.id))
                .map((m) => (
                  <label key={m.id}>
                    <input
                      type="checkbox"
                      name="assignees"
                      value={m.id}
                      defaultChecked={task?.assigneeIds.includes(m.id) ?? false}
                    />
                    {m.name}
                  </label>
                ))}
              {!members.some((m) => brand?.memberIds.includes(m.id)) && (
                <small>Marka detayından önce ekip üyesi atayın.</small>
              )}
            </div>
          ) : (
            <p>Görev size atanır.</p>
          )}
        </div>
        <label className="span-2">
          Açıklama
          <textarea
            defaultValue={task?.description}
            name="description"
            maxLength={10000}
            placeholder="Beklenen çıktıyı ve gerekli detayları yazın."
          />
        </label>
      </div>
    </ActionForm>
  );
}
