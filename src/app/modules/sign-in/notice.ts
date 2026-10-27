// El aviso de la entrada (R1.3, R2.8, R2.9, R3.4): qué falló al intentar entrar, traducido de lo
// que contestó el servidor. «Vencido» es un pase de Google pedido con un nonce que ya no sirve: la
// entrada pide otro y la persona vuelve a tocar Google. Con demasiados intentos, cuenta los segundos hasta poder volver a probar.
import { useEffect, useState } from 'preact/hooks';
import type { ApiResult } from '../../platform/api.ts';

export type Notice =
  | { kind: 'not-authorized'; email: string }
  | { kind: 'too-many'; seconds: number }
  | { kind: 'expired' };

// Lo que no es un aviso de la entrada (cancelar, sin conexión) no cambia nada: la luz ya lo dice.
export function noticeOf(result: ApiResult<unknown>): Notice | undefined {
  if (result.ok) return undefined;
  if (result.error === 'not-authorized')
    return { kind: 'not-authorized', email: String(result.email ?? '') };
  if (result.error === 'sign-in-expired') return { kind: 'expired' };
  if (result.error === 'too-many-attempts')
    return { kind: 'too-many', seconds: Number(result.retryAfterSeconds) };
  return undefined;
}

export function useNotice() {
  const [notice, setNotice] = useState<Notice>();

  useEffect(() => {
    if (notice?.kind !== 'too-many') return;
    const timer = setTimeout(
      () =>
        setNotice(
          notice.seconds > 1 ? { kind: 'too-many', seconds: notice.seconds - 1 } : undefined,
        ),
      1000,
    );
    return () => clearTimeout(timer);
  }, [notice]);

  return { notice, setNotice };
}

export const minutes = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
