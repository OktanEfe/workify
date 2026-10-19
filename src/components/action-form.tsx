'use client';
import { useActionState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { submitOperation, type ActionState } from '@/app/workspace/mutations';
export function ActionForm({
  operation,
  children,
  label = 'Kaydet',
  className = '',
  reset = false,
}: {
  operation: string;
  children: React.ReactNode;
  label?: string;
  className?: string;
  reset?: boolean;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    submitOperation,
    {},
  );
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) {
      if (reset) ref.current?.reset();
      if (state.href) router.push(state.href);
      router.refresh();
    }
  }, [state, router, reset]);
  return (
    <form action={action} className={className} ref={ref}>
      <input type="hidden" name="operation" value={operation} />
      <fieldset disabled={pending}>
        {children}
        <button className="action-button" type="submit">
          {pending ? 'Kaydediliyor…' : label}
        </button>
      </fieldset>
      {state.message && (
        <p className={state.ok ? 'form-success' : 'form-error'} role="status">
          {state.message}
        </p>
      )}
    </form>
  );
}
