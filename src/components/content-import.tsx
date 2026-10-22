'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  parseIdeaRows,
  validateWorkbookZip,
  type ImportedIdea,
} from '@/lib/content-ideas';
import { importIdeas } from '@/app/workspace/content/actions';
export function ContentImport({
  brands,
}: {
  brands: { id: string; name: string }[];
}) {
  const [rows, setRows] = useState<ImportedIdea[]>([]),
    [brand, setBrand] = useState(brands[0]?.id ?? ''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [filename, setFilename] = useState('');
  const router = useRouter();
  return (
    <section className="panel inspiration-import">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">EXCEL → FİKİR HAVUZU</span>
          <h2>Tablonuzu içeri aktarın</h2>
          <p>
            İlk sayfadan en fazla 100 fikir. Önce kontrol edin, sonra markaya
            ekleyin.
          </p>
        </div>
      </div>
      <div className="form-grid">
        <label>
          Hedef marka
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            disabled={busy}
          >
            {brands.map((b) => (
              <option value={b.id} key={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Excel dosyası (.xlsx, en fazla 2 MB)
          <input
            type="file"
            accept=".xlsx"
            disabled={busy || !brands.length}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              setRows([]);
              setMessage('');
              setFilename('');
              if (!file) return;
              setBusy(true);
              try {
                if (!/\.xlsx$/i.test(file.name) || file.size > 2097152)
                  throw Error('En fazla 2 MB boyutunda .xlsx dosyası seçin.');
                validateWorkbookZip(new Uint8Array(await file.arrayBuffer()));
                const read = await import('read-excel-file/browser');
                const table = await read.readSheet(file, 1);
                setRows(parseIdeaRows(table));
                setFilename(file.name);
              } catch (error) {
                setMessage(
                  error instanceof Error && error.message.length < 250
                    ? error.message
                    : 'Excel okunamadı. Sade bir .xlsx dosyası seçin.',
                );
              } finally {
                setBusy(false);
              }
            }}
          />
        </label>
      </div>
      <p className="help">
        İlk satır:{' '}
        <strong>Başlık · Açıklama · Kanal · Format · Örnek linkler</strong>.
        Yalnız Başlık zorunlu. Boş kanal Instagram, boş format Gönderi olur.
        Linkleri aynı hücrede yeni satır veya noktalı virgülle ayırın. Tarihler
        ve formüller aktarılmaz; dosyanın kendisi saklanmaz.
      </p>
      {rows.length > 0 && (
        <>
          <h3>
            {filename} · {rows.length} fikir hazır
          </h3>
          <div className="import-preview">
            <table>
              <thead>
                <tr>
                  <th>Başlık</th>
                  <th>Kanal / format</th>
                  <th>Örnek</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 10).map((r, i) => (
                  <tr key={i}>
                    <td>{r.title}</td>
                    <td>
                      {r.channel} · {r.format}
                    </td>
                    <td>{r.referenceLinks.length} link</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            İlk 10 satır gösterilir. Aynı Excel satırını tekrar aktarmak kopya
            oluşturmaz.
          </p>
          <button
            type="button"
            disabled={busy || !brand}
            onClick={async () => {
              setBusy(true);
              setMessage('');
              try {
                const result = await importIdeas({ brandId: brand, rows });
                if (!result.ok) setMessage(result.message);
                else {
                  setMessage(
                    `${result.inserted} fikir eklendi; ${result.skipped} aynı satır atlandı.`,
                  );
                  setRows([]);
                  router.refresh();
                }
              } catch {
                setMessage('Aktarım tamamlanamadı. Tekrar deneyin.');
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? 'Aktarılıyor…' : `${rows.length} fikri markaya ekle`}
          </button>
        </>
      )}
      {message && <p role="status">{message}</p>}
      {busy && <p role="status">İşleniyor…</p>}
    </section>
  );
}
