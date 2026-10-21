'use client';
import { useState } from 'react';
import { createAuthClient } from 'better-auth/react';
const auth = createAuthClient();
export function PasswordForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  return (
    <form
      className="password-form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy) return;
        const form = event.currentTarget;
        const data = new FormData(form);
        const newPassword = String(data.get('newPassword') ?? '');
        setSuccess(false);
        setMessage('');
        if (newPassword !== data.get('confirmation')) {
          setMessage('Yeni parolalar eşleşmiyor.');
          return;
        }
        if (newPassword === data.get('currentPassword')) {
          setMessage('Yeni parolanız mevcut parolanızdan farklı olmalı.');
          return;
        }
        setBusy(true);
        try {
          const result = await auth.changePassword({
            currentPassword: String(data.get('currentPassword') ?? ''),
            newPassword,
            revokeOtherSessions: true,
          });
          if (result.error)
            setMessage(
              'Parola değiştirilemedi. Mevcut parolanızı kontrol edip tekrar deneyin. Oturumunuz eskiyse yeniden giriş yapın.',
            );
          else {
            form.reset();
            setSuccess(true);
            setMessage(
              'Parolanız değiştirildi. Diğer cihazlardaki oturumlarınız kapatıldı.',
            );
          }
        } catch {
          setMessage('Bağlantı kurulamadı. Lütfen tekrar deneyin.');
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Mevcut parola
        <input
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
        />
      </label>
      <label>
        Yeni parola
        <input
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={128}
        />
        <small>12–128 karakter kullanın.</small>
      </label>
      <label>
        Yeni parola tekrar
        <input
          name="confirmation"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={128}
        />
      </label>
      <p className="security-note">
        Değişiklikten sonra diğer cihazlardaki oturumlarınız kapatılır. İki
        aşamalı doğrulamanız korunur.
      </p>
      {message && (
        <p
          role={success ? 'status' : 'alert'}
          className={success ? 'success-message' : 'error'}
        >
          {message}
        </p>
      )}
      <button type="submit" disabled={busy}>
        {busy ? 'Kaydediliyor…' : 'Parolamı değiştir'}
      </button>
    </form>
  );
}
