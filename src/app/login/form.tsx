'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createAuthClient } from 'better-auth/react';
import { twoFactorClient } from 'better-auth/client/plugins';
const auth = createAuthClient({ plugins: [twoFactorClient()] });
export function LoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [challenge, setChallenge] = useState(false);
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
          if (challenge) {
            const result = await auth.twoFactor.verifyTotp({
              code: String(data.get('code')),
            });
            if (result.error) setError('Doğrulama kodu kabul edilmedi.');
            else enter();
          } else {
            const result = await auth.signIn.email({
              email: String(data.get('email')).trim(),
              password: String(data.get('password')),
            });
            if (result.error)
              setError(
                result.error.status === 429
                  ? 'Çok fazla giriş denemesi yapıldı. Bir dakika bekleyip tekrar deneyin.'
                  : result.error.status === 403
                    ? 'Giriş adresi doğrulanamadı. Sayfayı localhost:3000/login adresinden açın.'
                    : 'E-posta veya parola hatalı. Bilgilerinizi kontrol edip tekrar deneyin.',
              );
            else if (result.data && 'twoFactorRedirect' in result.data)
              setChallenge(true);
            else enter();
          }
        } catch {
          setError('Sunucuya ulaşılamadı. Lütfen tekrar deneyin.');
        } finally {
          setBusy(false);
        }
      }}
    >
      {challenge ? (
        <>
          <label htmlFor="code">Doğrulayıcı uygulama kodu</label>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
          />
        </>
      ) : (
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
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button disabled={busy} type="submit">
        {busy
          ? 'Kontrol ediliyor…'
          : challenge
            ? 'Kodu doğrula'
            : 'Çalışma alanına gir →'}
      </button>
      <p className="help">
        Parolanızı unuttuysanız yöneticinizle iletişime geçin.
      </p>
    </form>
  );
}
