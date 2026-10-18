'use client';
import { useRouter } from 'next/navigation';
import { createAuthClient } from 'better-auth/react';
import { useState } from 'react';
export function SignOut() {
  const router = useRouter();
  const [error, setError] = useState(false);
  return (
    <div>
      <button
        className="quiet"
        onClick={async () => {
          try {
            const result = await createAuthClient().signOut();
            if (result.error) setError(true);
            else {
              router.replace('/login');
              router.refresh();
            }
          } catch {
            setError(true);
          }
        }}
      >
        Çıkış yap
      </button>
      {error && <p role="alert">Çıkış yapılamadı. Tekrar deneyin.</p>}
    </div>
  );
}
