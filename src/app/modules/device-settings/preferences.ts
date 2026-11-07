// Lo que eligió cada persona en este dispositivo (04 · R1.3; diseño de 04, § 2): se guarda en el
// dispositivo, por persona, y se aplica al entrar; en la entrada, sin nadie, vale lo de arranque. Lo
// guardado lo puede tocar cualquiera con el dispositivo: se valida al leerlo, y lo que no tiene forma
// cuenta como lo de arranque.
import * as z from 'zod/mini';
import { readStored, store } from '../../platform/device/storage.ts';
import { motionOff } from '../../platform/motion.ts';
import { flag, oneOf } from '../../platform/schema.ts';
import { createStore } from '../../platform/store.ts';
import { timeFormat } from '../../platform/time.ts';
import { person } from '../sign-in/index.ts';
import { defaults, isDefault, type Preferences } from './rules.ts';
import { deviceSettingsSettings } from './settings.ts';

const key = 'preferences';
// La persona que cambió algo más recientemente, primero; sin horas (revisión de seguridad).
type Saved = { order: string[]; of: Record<string, Preferences> };

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const preferencesSchema = z.object({
  animations: flag,
  timeFormat: oneOf(['h24', 'h12'] as const),
});

// Lo de una persona, si la clave y el valor tienen forma.
function valid(of: object, id: unknown): Preferences | undefined {
  if (typeof id !== 'string' || !uuid.test(id) || !Object.hasOwn(of, id)) return undefined;
  const parsed = preferencesSchema.safeParse((of as Record<string, unknown>)[id]);
  return parsed.success ? parsed.data : undefined;
}

function read(): Saved {
  const raw = readStored<{ order?: unknown; of?: unknown }>(key);
  const order = Array.isArray(raw?.order) ? raw.order : [];
  const of = (typeof raw?.of === 'object' && raw.of) || {};
  const saved: Saved = { order: [], of: {} };
  for (const id of order) {
    const found = valid(of, id);
    if (!found || Object.hasOwn(saved.of, id)) continue;
    saved.order.push(id);
    saved.of[id] = found;
    if (saved.order.length === deviceSettingsSettings.maxPeople) break;
  }
  return saved;
}

// Lo de quien está adentro ahora (o lo de arranque), al día para las pantallas.
export const preferences = createStore<Preferences>(defaults);

function apply(next: Preferences): void {
  preferences.set(next);
  motionOff.set(!next.animations);
  timeFormat.set(next.timeFormat);
}

const of = (userId: string | undefined) => (userId !== undefined && read().of[userId]) || defaults;

// Cambia lo de esta persona. Volver a lo de arranque borra su fila (R1.11).
// Parte de lo que tiene ahora quien está adentro, no de lo guardado: si el dispositivo no deja
// guardar, cambiar una cosa no vuelve las otras a lo de arranque (R1.5).
export function choose(userId: string, change: Partial<Preferences>): void {
  const now = person.get()?.userId === userId ? preferences.get() : of(userId);
  const next = { ...now, ...change };
  const saved = read();
  const others = saved.order.filter((id) => id !== userId);
  const order = isDefault(next) ? others : [userId, ...others];
  const kept = order.slice(0, deviceSettingsSettings.maxPeople);
  store(key, {
    order: kept,
    of: Object.fromEntries(kept.map((id) => [id, id === userId ? next : saved.of[id]])),
  });
  apply(next);
}

export const backToDefaults = (userId: string) => choose(userId, defaults);

// Se llama una vez al arrancar, antes de dibujar: aplica lo de quien está adentro y lo vuelve a
// aplicar cada vez que entra o sale alguien.
export function watchPreferences(): () => void {
  apply(of(person.get()?.userId));
  return person.subscribe((who) => apply(of(who?.userId)));
}
