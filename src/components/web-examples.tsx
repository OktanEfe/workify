'use client';
import { useState } from 'react';
import { findWebExamples } from '@/app/workspace/content/actions';
import type { WebExample } from '@/services/content-inspiration';
export function WebExamples({
  id,
  initialQuery,
  configured,
  referenceCount,
}: {
  id: string;
  initialQuery: string;
  configured: boolean;
  referenceCount: number;
}) {
  const [inspectReferences, setInspectReferences] = useState(false);
  const [analysis, setAnalysis] = useState<string[]>([]);
  const [query, setQuery] = useState(initialQuery),
    [results, setResults] = useState<WebExample[]>([]),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [searched, setSearched] = useState(false);
  return (
    <div className="web-example-search">
      <h3>İnternette yeni örnekler bul</h3>
      <p>
        Arama metnini düzenleyin. Yalnız bu metin, kanal ve format arama
        servisine gönderilir; tüm içerik arşiviniz paylaşılmaz.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          setMessage('');
          setResults([]);
          setAnalysis([]);
          setSearched(false);
          try {
            const result = await findWebExamples(id, query, inspectReferences);
            if (!result.ok) setMessage(result.message);
            else if (!result.configured)
              setMessage(
                'İnternet araması henüz bağlanmadı. Yönetici sunucuda arama servisini etkinleştirmeli.',
              );
            else {
              setResults(result.results);
              setAnalysis('analysis' in result ? (result.analysis ?? []) : []);
              setSearched(true);
            }
          } catch {
            setMessage('Arama tamamlanamadı. Tekrar deneyin.');
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Ne arayalım?
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            minLength={3}
            maxLength={180}
            required
          />
        </label>
        {referenceCount > 0 && (
          <label className="inspect-toggle">
            <input
              type="checkbox"
              checked={inspectReferences}
              onChange={(e) => setInspectReferences(e.target.checked)}
            />
            Örnek linklerin metnini de incele (en fazla 3 link arama servisine
            gönderilir)
          </label>
        )}
        <button disabled={busy || !configured}>
          {busy ? 'Örnekler aranıyor…' : 'Bunlara da bak! ↗'}
        </button>
      </form>
      {!configured && (
        <p className="security-note">
          İnternet araması için servis bağlantısı bekleniyor. Arşiv
          eşleştirmeleri ve üretim fikirleri kullanılabilir.
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {searched && !results.length && (
        <p role="status">
          Yeni örnek bulunamadı. Konuyu daha kısa veya farklı kelimelerle
          deneyin.
        </p>
      )}
      {analysis.length > 0 && (
        <aside className="security-note">
          <strong>Örnek link analizi</strong>
          {analysis.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
          <small>
            Okunabilen sayfa metinlerinden konu kelimeleri çıkarılır. Video
            görüntüsü, ses veya kapalı sosyal ağ paylaşımları analiz edilmez.
          </small>
        </aside>
      )}
      <div className="example-grid">
        {results.map((r) => (
          <article key={r.url} className="example-card">
            <span className="eyebrow">
              İNTERNETTEN · {new URL(r.url).hostname}
            </span>
            <h4>{r.title}</h4>
            <p>
              {r.description
                ? r.description.slice(0, 230) +
                  (r.description.length > 230 ? '…' : '')
                : 'Arama servisi açıklama sunmadı.'}
            </p>
            <a href={r.url} target="_blank" rel="noopener noreferrer">
              Kaynağa bak ↗
            </a>
          </article>
        ))}
      </div>
      <small>
        Sonuçlar canlı web aramasından gelir. Video görüntüsü analiz edilmez;
        uygunluğu kaynağında kontrol edin.
      </small>
    </div>
  );
}
