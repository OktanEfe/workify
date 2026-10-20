'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { createAuthClient } from 'better-auth/react';
import { twoFactorClient } from 'better-auth/client/plugins';
const auth = createAuthClient({ plugins: [twoFactorClient()] });
export function SecurityForm() {
  const router = useRouter();
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
                setMessage('İki aşamalı doğrulama etkinleştirildi.');
                router.replace('/workspace');
                router.refresh();
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
              Google Authenticator, Microsoft Authenticator veya benzer bir
              uygulamayla bu QR kodunu tarayın.
            </p>
            <div className="mfa-qr">
              <QRCodeSVG
                value={setup.totpURI}
                size={210}
                marginSize={4}
                level="M"
                title="Doğrulayıcı kurulum QR kodu"
              />
            </div>
            <details>
              <summary>QR tarayamıyorsanız manuel kurulum</summary>
              <p>Tür: Zamana dayalı (TOTP). Kurulum anahtarı:</p>
              <code className="mfa-key">
                {new URL(setup.totpURI).searchParams.get('secret')}
              </code>
            </details>
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
