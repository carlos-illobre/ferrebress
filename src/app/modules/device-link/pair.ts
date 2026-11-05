// Vincular con el botón (R1.3 a R1.6; diseño de 03, § 10.3): el QR de la computadora lleva la
// dirección /pair#<código> (lo de después del # no llega a los registros del servidor); el celular lo
// lee con «Leer el código» o con la cámara del teléfono, y el servidor dice si quedaron vinculados,
// si hay que preguntar antes de reemplazar, o por qué no.
import type { PairingView, ReadCodeResponse } from '@ferrebress/shared/contracts/device-link';
import { clearHash, navigate, route } from '../../platform/router.ts';
import { api } from '../../platform/server/api.ts';
import { pendingEntries } from '../sign-in/index.ts';

export const pairPath = '/pair';

export const pairUrl = (code: string) => `${location.origin}${pairPath}#${code}`;

// Lo que leyó la cámara, si es un código de vincular de esta aplicación.
export function pairCodeOf(text: string): string | undefined {
  try {
    const url = new URL(text);
    if (url.origin !== location.origin || url.pathname !== pairPath) return undefined;
    return url.hash.slice(1) || undefined;
  } catch {
    return undefined;
  }
}

export type Reading =
  | { kind: 'paired'; pairing: PairingView }
  // `was`: la computadora con la que está vinculado hoy este celular; sin ella, la que se lee ya
  // tenía otro celular.
  | { kind: 'replace'; ticket: string; was: string | undefined }
  | { kind: 'other-account' | 'expired' | 'offline' | 'failed' };

const refusals: Record<string, Reading['kind']> = {
  'other-account': 'other-account',
  'code-expired': 'expired',
  'code-used': 'expired',
  offline: 'offline',
};

function readingOf(result: Awaited<ReturnType<typeof api<ReadCodeResponse>>>): Reading {
  if (!result.ok) return { kind: (refusals[result.error] ?? 'failed') as 'failed' };
  if ('pairing' in result.data) return { kind: 'paired', pairing: result.data.pairing };
  return { kind: 'replace', ticket: result.data.ticket, was: result.data.replaces.phone };
}

// Con una entrada sin conexión que el servidor todavía no confirmó, no se vincula: «Para vincular hace
// falta internet» (E36). El pedido saldría con una sesión que el servidor no conoce.
const send = async (path: string, body: Record<string, string>): Promise<Reading> =>
  pendingEntries.get() > 0
    ? { kind: 'offline' }
    : readingOf(await api<ReadCodeResponse>(`/api/device-link/codes/${path}`, body));

// Leer el código en el servidor.
export const readCode = (code: string) => send('read', { code });

// Aceptar el reemplazo (R1.4), con el boleto que dio la lectura.
export const acceptTicket = (ticket: string) => send('accept', { ticket });

// La dirección que abrió la cámara del teléfono (E02): se lee una vez y se borra, así no queda en el
// historial. Con sesión, devuelve el código para vincular; sin sesión no vincula: queda la entrada
// (E40).
export function takePairCode(signedIn: boolean): string | undefined {
  const { path, hash } = route.get();
  if (path !== pairPath) return undefined;
  clearHash();
  navigate('/', { replace: true });
  return signedIn && hash ? hash : undefined;
}
