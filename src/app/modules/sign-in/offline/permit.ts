// Entrar sin conexión en el celular (15 · R1, R2; diseño de 15, § 5): lo que el celular guarda para
// poder hacerlo y hasta cuándo puede. El permiso es la persona que prendió «Trabajar sin conexión»;
// el contacto, la hora del celular del último pedido con sesión que el servidor aceptó, y la hora
// más alta que vio, para que atrasar el reloj no dé más tiempo. Nada de esto es secreto.
import type { Person } from '@ferrebress/shared/contracts/sign-in';
import { forget, readStored, store } from '../../../platform/device/storage.ts';
import { createStore } from '../../../platform/store.ts';

const permitKey = 'offline-permit';
const contactKey = 'offline-contact';

const minute = 60_000;
export const offlineWindowMs = 24 * 60 * minute;
// Lo que se le perdona al reloj del celular si va un poco para atrás (un ajuste de hora).
const clockSlackMs = 5 * minute;

export type Permit = { person: Person; revoked: boolean };
type Contact = { at: number; maxSeenAt: number };

export const permit = createStore<Permit | undefined>(readStored<Permit>(permitKey));

function savePermit(next: Permit | undefined): void {
  if (next) store(permitKey, next);
  else forget(permitKey);
  permit.set(next);
}

const contact = (): Contact | undefined => readStored<Contact>(contactKey);

// La hora más alta que vio la aplicación: la de ahora, si es más alta.
function saw(now: number): Contact | undefined {
  const known = contact();
  if (known && now > known.maxSeenAt) store(contactKey, { ...known, maxSeenAt: now });
  return contact();
}

// El servidor aceptó un pedido con sesión: el plazo vuelve a contar desde ahora.
export function contacted(at: number): void {
  store(contactKey, { at, maxSeenAt: Math.max(at, contact()?.maxSeenAt ?? at) });
  const current = permit.get();
  if (current?.revoked) savePermit({ ...current, revoked: false });
}

// Prender la opción (R1.3): con la persona de la sesión, que ya dijo que puede.
export const enableOffline = (who: Person) => savePermit({ person: who, revoked: false });
export const disableOffline = () => savePermit(undefined);

// La sesión la cerró otro dispositivo: no se entra sin conexión hasta el próximo contacto (R2.2).
export function revokeOffline(): void {
  const current = permit.get();
  if (current) savePermit({ ...current, revoked: true });
}

// Hasta cuándo se puede entrar sin conexión, o undefined si no se puede (R2.2, R2.3).
export function offlineUntil(now = Date.now()): Date | undefined {
  const known = saw(now);
  const current = permit.get();
  if (!current || current.revoked || !known) return undefined;
  if (now < known.maxSeenAt - clockSlackMs) return undefined;
  const until = known.at + offlineWindowMs;
  return now < until ? new Date(until) : undefined;
}

// La sesión abierta sin conexión ya cumplió su plazo (R2.7). Apagar la opción no la corta.
export function offlineSessionOver(now = Date.now()): boolean {
  const known = contact();
  return !known || now >= known.at + offlineWindowMs;
}

// La última hora de contacto, para la entrada que se firma.
export const lastContactAt = (): number | undefined => contact()?.at;
