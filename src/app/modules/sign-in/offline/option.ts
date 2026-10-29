// Entrar sin conexión en el celular (15 · R1, R2; diseño de 15, § 5): lo que el celular guarda para
// poder hacerlo y hasta cuándo puede. La opción es la persona que prendió «Trabajar sin conexión»
// (su identificador, nombre y rol); el contacto, la hora del celular del último pedido con sesión
// de esa persona que el servidor aceptó, y la hora más alta que vio, para que atrasar el reloj no
// dé más tiempo (con 5 minutos de margen por los ajustes de hora del celular). Nada es secreto.
import { offlineWindowHours } from '@ferrebress/shared/contracts/offline-sign-in';
import type { Person } from '@ferrebress/shared/contracts/sign-in';
import { forget, readStored, store } from '../../../platform/device/storage.ts';
import { createStore } from '../../../platform/store.ts';

const optionKey = 'offline-option';
const contactKey = 'offline-contact';

const minute = 60_000;
export const offlineWindowMs = offlineWindowHours * 60 * minute;
const clockSlackMs = 5 * minute;

type Who = Pick<Person, 'userId' | 'name' | 'role'>;
export type OfflineOption = { person: Who; revoked: boolean };
type Contact = { at: number; maxSeenAt: number };

export const offlineOption = createStore<OfflineOption | undefined>(
  readStored<OfflineOption>(optionKey),
);

function save(next: OfflineOption | undefined): void {
  if (next) store(optionKey, next);
  else forget(optionKey);
  offlineOption.set(next);
}

const contact = (): Contact | undefined => readStored<Contact>(contactKey);

// La hora más alta que vio la aplicación: la de ahora, si es más alta.
function saw(now: number): Contact | undefined {
  const known = contact();
  if (known && now > known.maxSeenAt) store(contactKey, { ...known, maxSeenAt: now });
  return contact();
}

// Si el reloj del celular se atrasó por debajo de la hora más alta que vio (R2.3).
const wentBack = (known: Contact, now: number) => now < known.maxSeenAt - clockSlackMs;

// El servidor aceptó un pedido con sesión: el plazo vuelve a contar desde ahora.
export function contacted(at: number): void {
  store(contactKey, { at, maxSeenAt: Math.max(at, contact()?.maxSeenAt ?? at) });
  const current = offlineOption.get();
  if (current?.revoked) save({ ...current, revoked: false });
}

// Prender la opción (R1.3): con la persona de la sesión, que ya dijo que puede.
export const enableOffline = ({ userId, name, role }: Person) =>
  save({ person: { userId, name, role }, revoked: false });
export const disableOffline = () => save(undefined);

// La persona cambió su nombre o su rol: la opción guarda el de ahora.
export function updateOffline({ userId, name, role }: Person): void {
  const current = offlineOption.get();
  const same = current?.person.name === name && current.person.role === role;
  if (current && current.person.userId === userId && !same)
    save({ ...current, person: { userId, name, role } });
}

// La sesión la cerró otro dispositivo: no se entra sin conexión hasta el próximo contacto (R2.2).
export function revokeOffline(): void {
  const current = offlineOption.get();
  if (current) save({ ...current, revoked: true });
}

// Hasta cuándo se puede entrar sin conexión, o undefined si no se puede (R2.2, R2.3).
export function offlineUntil(now = Date.now()): Date | undefined {
  const known = saw(now);
  const current = offlineOption.get();
  if (!current || current.revoked || !known || wentBack(known, now)) return undefined;
  const until = known.at + offlineWindowMs;
  return now < until ? new Date(until) : undefined;
}

// La sesión abierta sin conexión ya cumplió su plazo, o el reloj se atrasó (R2.3, R2.7). Apagar la
// opción no la corta.
export function offlineSessionOver(now = Date.now()): boolean {
  const known = saw(now);
  return !known || wentBack(known, now) || now >= known.at + offlineWindowMs;
}

// La última hora de contacto, para la entrada que se firma.
export const lastContactAt = (): number | undefined => contact()?.at;
