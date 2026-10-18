'use client';
import { useState } from 'react';
import { createAuthClient } from 'better-auth/react';
import { twoFactorClient } from 'better-auth/client/plugins';
const auth = createAuthClient({ plugins: [twoFactorClient()] });
export function SecurityForm() {
  const [setup, setSetup] = useState<{
    totpURI: string;
    backupCodes: string[];
  } | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setMessage('');
          const data = new FormData(e.currentTarget);
          try {
            if (!setup) {
              const result = await auth.twoFactor.enable({
                password: String(data.get('password')),
              });
              if (result.error)
                setMessage('Kurulum başlatılamadı. Parolanızı kontrol edin.');
              else if (result.data && result.data.method === 'totp')
                setSetup(result.data);
            } else {
              const result = await auth.twoFactor.verifyTotp({
                code: String(data.get('code')),
              });
              if (result.error) setMessage('Kod doğrulanamadı.');
              else {
                setSetup(null);
                setMessage(
                  'İki aşamalı doğrulama etkinleştirildi. Çalışma alanına dönebilirsiniz.',
                );
              }
            }
          } catch {
            setMessage('İşlem tamamlanamadı. Lütfen tekrar deneyin.');
          } finally {
            setBusy(false);
          }
        }}
      >
        {setup ? (
          <>
            <p>
              Bu kurulum bağlantısını doğrulayıcı uygulamanıza aktarın. Bağlantı
              ve yedek kodlar gizlidir.
            </p>
            <textarea
              aria-label="Doğrulayıcı kurulum bağlantısı"
              readOnly
              value={setup.totpURI}
            />
            <p>Yedek kodları güvenli bir yerde saklayın:</p>
            <pre>{setup.backupCodes.join('\n')}</pre>
            <label htmlFor="code">Uygulamadaki 6 haneli kod</label>
            <input
              id="code"
              name="code"
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
            />
          </>
        ) : (
          <>
            <label htmlFor="password">Mevcut parolanız</label>
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
        <button disabled={busy}>
          {busy ? 'İşleniyor…' : setup ? 'Kodu doğrula' : 'Doğrulamayı kur'}
        </button>
      </form>
      {message && <p role="status">{message}</p>}
    </>
  );
}
