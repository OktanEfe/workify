'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createAuthClient } from 'better-auth/react';
const auth = createAuthClient();
export function LoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  function enter() {
    router.replace('/workspace');
    router.refresh();
  }
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setError('');
        setBusy(true);
        const data = new FormData(e.currentTarget);
        try {
          const result = await auth.signIn.email({
            email: String(data.get('email')).trim(),
            password: String(data.get('password')),
          });
          if (result.error)
            setError(
              result.error.status === 429
                ? 'Çok fazla giriş denemesi yapıldı. Bir dakika bekleyip tekrar deneyin.'
                : result.error.status === 403
                  ? 'Giriş adresi doğrulanamadı. Bu sitenin giriş sayfasını yenileyip tekrar deneyin.'
                  : 'E-posta veya parola hatalı. Bilgilerinizi kontrol edip tekrar deneyin.',
            );
          else enter();
        } catch {
          setError('Sunucuya ulaşılamadı. Lütfen tekrar deneyin.');
        } finally {
          setBusy(false);
        }
      }}
    >
      <>
        <label htmlFor="email">İş e-posta adresi</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="ad@avrasiacreative.com"
          required
          maxLength={254}
        />
        <label htmlFor="password">Parola</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
        />
      </>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button disabled={busy} type="submit">
        {busy ? 'Kontrol ediliyor…' : 'Çalışma alanına gir →'}
      </button>
      <p className="help">
        Parolanızı unuttuysanız yöneticinizle iletişime geçin.
      </p>
    </form>
  );
}
