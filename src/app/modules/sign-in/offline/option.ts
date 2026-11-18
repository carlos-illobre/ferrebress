// Entrar sin conexión en el celular (15 · R1, R2; diseño de 15, § 5): lo que el celular guarda para
// poder hacerlo y hasta cuándo puede. La opción es la persona que prendió «Trabajar sin conexión»
// (su identificador, nombre, roles y permisos, los de la última vez que habló con el servidor: 02 ·
// R7.9); el contacto, la hora del celular del último pedido con sesión
// de esa persona que el servidor aceptó, y la hora más alta que vio, para que atrasar el reloj no
// dé más tiempo (con 5 minutos de margen por los ajustes de hora del celular). Nada es secreto.
import { fallbackOfflineHours } from '@ferrebress/shared/contracts/offline-sign-in';
import type { Person } from '@ferrebress/shared/contracts/sign-in';
import { forget, readStored, store } from '../../../platform/device/storage.ts';
import { createStore } from '../../../platform/store.ts';
import { signInSettings } from '../settings.ts';

const optionKey = 'offline-option';
const contactKey = 'offline-contact';

type Who = Omit<Person, 'email' | 'offline'>;
export type OfflineOption = { person: Who; revoked: boolean };
// `hours`: las horas sin conexión que dijo el servidor en ese contacto (06 · R11.1).
type Contact = { at: number; maxSeenAt: number; hours?: number };

const who = ({ email: _, offline: __, ...person }: Person): Who => person;

// Una opción guardada antes de los roles no tiene permisos: los trae el próximo contacto.
const noRoles = { roles: [], permissions: [], rolesChangedBy: null, rolesChangedAt: null };
const stored = readStored<OfflineOption>(optionKey);
export const offlineOption = createStore<OfflineOption | undefined>(
  stored && { ...stored, person: Object.assign({}, noRoles, stored.person) },
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
const wentBack = (known: Contact, now: number) =>
  now < known.maxSeenAt - signInSettings.offline.clockSlackMs;

// Las horas sin conexión de la última respuesta del servidor; se guardan con el próximo contacto.
let heardHours: number | undefined;
export function heardOfflineHours(value: string | undefined): void {
  const hours = Number(value);
  heardHours = Number.isInteger(hours) && hours > 0 ? hours : undefined;
}

// Las horas que valen para este celular: las del último contacto, o las que dijo el servidor.
export const knownOfflineHours = (): number =>
  contact()?.hours ?? heardHours ?? fallbackOfflineHours;

// Hasta cuándo dura un contacto: con sus horas, o las más cortas si se guardó sin ellas.
const endOf = (known: Contact) =>
  known.at + (known.hours ?? fallbackOfflineHours) * signInSettings.offline.hourMs;

// El servidor aceptó un pedido con sesión: el plazo vuelve a contar desde ahora, con las horas que
// dijo (las de antes, si esta vez no las dijo).
export function contacted(at: number): void {
  const known = contact();
  const hours = heardHours ?? known?.hours;
  store(contactKey, {
    at,
    maxSeenAt: Math.max(at, known?.maxSeenAt ?? at),
    ...(hours !== undefined && { hours }),
  });
  const current = offlineOption.get();
  if (current?.revoked) save({ ...current, revoked: false });
}

// Prender la opción (R1.3): con la persona de la sesión, que ya dijo que puede.
export const enableOffline = (person: Person) => save({ person: who(person), revoked: false });
export const disableOffline = () => save(undefined);

// La persona cambió su nombre, sus roles o sus permisos: la opción guarda lo de ahora.
export function updateOffline(person: Person): void {
  const current = offlineOption.get();
  const now = who(person);
  const same = JSON.stringify(current?.person) === JSON.stringify(now);
  if (current && current.person.userId === person.userId && !same)
    save({ ...current, person: now });
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
  const until = endOf(known);
  return now < until ? new Date(until) : undefined;
}

// La sesión abierta sin conexión ya cumplió su plazo, o el reloj se atrasó (R2.3, R2.7). Apagar la
// opción no la corta.
export function offlineSessionOver(now = Date.now()): boolean {
  const known = saw(now);
  return !known || wentBack(known, now) || now >= endOf(known);
}

// La última hora de contacto, para la entrada que se firma.
export const lastContactAt = (): number | undefined => contact()?.at;
