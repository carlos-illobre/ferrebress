// La tira del día (R4.4; diseño de 03, § 2.2): desde la primera conexión del día hasta ahora, un tramo
// por estado, «Directo», «Por el servidor» o el resto en gris («Separados»), con cuánto fue cada uno.
// Solo en este dispositivo, por persona; al día siguiente, o al desvincular (R2.4), empieza de cero.
// Cada dispositivo anota lo que vio. Las horas, del reloj del servidor; el día, el del negocio. Se
// guarda con una clave por persona que no la nombra (un resumen corto de su identificador, § 13 y
// § 16): otra persona en la misma computadora no ve ni borra la tira de la anterior.
import { businessDateOf } from '@ferrebress/shared/time/business';
import { readStored, store } from '../../platform/device/storage.ts';
import type { PairingState } from './machine/types.ts';

export type Lane = 'direct' | 'relayed' | 'apart';
export type Segment = { lane: Lane; from: number; to: number };
export type StripView = {
  segments: Segment[];
  totals: Record<Lane, number>;
  together: number;
  // De 0 a 100: qué parte del tiempo juntos fue directo.
  directShare: number;
};

type Saved = { day: string; marks: { lane: Lane; at: number }[] };

// Un resumen corto del identificador (FNV-1a de 32 bits): separa a las personas sin nombrarlas.
function shortHash(text: string): string {
  let hash = 0x811c9dc5;
  for (const char of text) hash = Math.imul(hash ^ (char.codePointAt(0) as number), 0x01000193);
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export const stripKeyOf = (owner: string) => `device-link.strip.${shortHash(owner)}`;
const laneOf = (kind: PairingState['kind']): Lane =>
  kind === 'direct' || kind === 'relayed' ? kind : 'apart';
const dayOf = (at: number) => businessDateOf(new Date(at));

type Options = { owner: string; now: () => number };

export function createStrip({ owner, now }: Options) {
  const stripKey = stripKeyOf(owner);
  const fresh = (): Saved => ({ day: dayOf(now()), marks: [] });
  const load = (): Saved => {
    const saved = readStored<Saved>(stripKey);
    return saved?.day === dayOf(now()) ? saved : fresh();
  };
  let saved = load();
  const listeners = new Set<() => void>();
  const changed = () => {
    store(stripKey, saved);
    for (const listener of listeners) listener();
  };

  return {
    // Cada cambio de estado del vínculo. La tira arranca con la primera conexión del día.
    mark(kind: PairingState['kind']) {
      if (kind === 'unpaired') {
        saved = fresh();
        return changed();
      }
      if (saved.day !== dayOf(now())) saved = fresh();
      const lane = laneOf(kind);
      if (saved.marks.length === 0 && lane === 'apart') return;
      if (saved.marks.at(-1)?.lane === lane) return;
      saved.marks.push({ lane, at: now() });
      changed();
    },
    view(): StripView {
      if (saved.day !== dayOf(now())) saved = fresh();
      const end = now();
      const segments = saved.marks.map((mark, i) => ({
        lane: mark.lane,
        from: mark.at,
        to: saved.marks[i + 1]?.at ?? end,
      }));
      const totals = { direct: 0, relayed: 0, apart: 0 };
      for (const segment of segments) totals[segment.lane] += segment.to - segment.from;
      const together = totals.direct + totals.relayed;
      const directShare = together === 0 ? 0 : Math.round((totals.direct / together) * 100);
      return { segments, totals, together, directShare };
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}

export type Strip = ReturnType<typeof createStrip>;
