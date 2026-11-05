// Las reglas de la cinta (R4.11), sin dibujo: una fila por persona que hizo o recibió algo ese día
// (más «Alguien sin entrar» arriba y «El sistema» abajo), dónde cae cada acción en el tiempo, lo que
// se ve con alguien aislado y cuánto espera «Reproducir» entre una acción y la siguiente.
import type { AuditView } from '@ferrebress/shared/contracts/audit-log';
import { auditLogSettings } from './settings.ts';
import { texts } from './texts.ts';

export type Lane = { id: string; name: string; made: number; got: number };

const laneOf = (event: AuditView): string =>
  event.actor.kind === 'person' ? event.actor.id : event.actor.kind;
const received = (event: AuditView) =>
  event.targets.filter((target) => target.kind === 'person').map((target) => target.id);

export function lanesOf(events: AuditView[]): Lane[] {
  const lanes = new Map<string, Lane>();
  const add = (id: string, name: string) => {
    if (!lanes.has(id)) lanes.set(id, { id, name, made: 0, got: 0 });
    return lanes.get(id) as Lane;
  };
  for (const event of events) {
    const { actor } = event;
    const name =
      actor.kind === 'person'
        ? (actor.name ?? actor.today ?? '')
        : actor.kind === 'system'
          ? texts.system
          : texts.outsider;
    add(laneOf(event), name).made++;
    for (const target of event.targets.filter((one) => one.kind === 'person'))
      add(target.id, target.name ?? target.today ?? '').got++;
  }
  const order = (lane: Lane) => (lane.id === 'outsider' ? 0 : lane.id === 'system' ? 2 : 1);
  return [...lanes.values()].sort((a, b) => order(a) - order(b));
}

// Lo que se recorre: todo el día, o lo que hizo y recibió la persona aislada.
export const visibleOf = (events: AuditView[], isolated: string | undefined) =>
  isolated
    ? events.filter((event) => laneOf(event) === isolated || received(event).includes(isolated))
    : events;

// Dónde cae cada acción, de 0 a 1, en el tramo del día que tiene acciones (con un margen).
export function timeline(events: AuditView[]) {
  const times = events.map((event) => Date.parse(event.at));
  const start = Math.min(...times) - auditLogSettings.tapeMarginMs;
  const end = Math.max(...times) + auditLogSettings.tapeMarginMs;
  return (event: AuditView) => (Date.parse(event.at) - start) / (end - start);
}

// Arrastrar el cabezal: de las que se ven (siempre hay alguna), la más cerca de donde está el dedo o
// el puntero, de 0 a 1.
export const nearest = (steps: AuditView[], where: (event: AuditView) => number, at: number) =>
  steps.reduce((best, event) =>
    Math.abs(where(event) - at) < Math.abs(where(best) - at) ? event : best,
  );

// Deslizar en el celular: un gesto de lado, más largo que alto, pasa a la siguiente o a la anterior.
export function swipeOf(dx: number, dy: number): 1 | -1 | undefined {
  if (Math.abs(dx) < 48 || Math.abs(dx) < 2 * Math.abs(dy)) return undefined;
  return dx < 0 ? 1 : -1;
}

export const lanesFor = (event: AuditView) => ({ from: laneOf(event), to: received(event) });

// «Reproducir»: el día entero en unos 14 segundos en la computadora; una acción por segundo en el
// celular (R4.11).
export const stepMs = (count: number, wide: boolean) =>
  wide ? Math.max(40, Math.floor(14_000 / Math.max(1, count))) : 1_000;
