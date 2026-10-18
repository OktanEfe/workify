'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="login-card">
      <h1>İşlem tamamlanamadı</h1>
      <p>Çalışma alanı şu anda kullanılamıyor. Lütfen tekrar deneyin.</p>
      <button onClick={reset}>Tekrar dene</button>
    </main>
  );
}
