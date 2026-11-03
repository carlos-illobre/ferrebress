// Cómo va una acción a su fila y vuelve (ADR-004): lo que se busca, en columnas; lo demás, en el
// `payload` comprimido. Lo usan quien escribe y quien lee, así las dos puntas no se desencuentran.
import { deflateRawSync, inflateRawSync } from 'node:zlib';
import type { Actor, AuditEvent, StoredEvent, Target, Tone } from './event.ts';
import { actorCodes, toneCodes } from './schema.ts';

// Una acción nunca se deja de anotar: si pesa más que esto, se cortan primero los valores de `data`
// y después los de `changes` (diseño de 05, § 2.2).
const maxPayloadBytes = 8 * 1024;
const maxNameLength = 80;
const maxEmailLength = 254;
const cut = '…';

export type EventRow = {
  id: number;
  at: number;
  type: string;
  tone: number;
  actor_kind: number;
  user_id: string | null;
  payload: Uint8Array;
};

type Payload = Omit<AuditEvent, 'type' | 'at' | 'actor' | 'people' | 'arrivedAt' | 'deviceTime'> & {
  name?: string;
  email?: string;
  arrivedAt?: number;
  deviceTime?: number;
  truncated?: true;
};

export const shortName = (name: string): string => name.slice(0, maxNameLength);

export function encode(event: AuditEvent, tone: Tone) {
  const { type, at, actor, people: _people, arrivedAt, deviceTime, targets, ...rest } = event;
  const payload: Payload = {
    ...rest,
    ...(targets && { targets: targets.map(shortTarget) }),
    ...(actor.kind === 'person' && actor.name && { name: shortName(actor.name) }),
    ...(actor.kind === 'outsider' &&
      actor.email && { email: actor.email.slice(0, maxEmailLength) }),
    ...(arrivedAt && { arrivedAt: arrivedAt.getTime() }),
    ...(deviceTime && { deviceTime: deviceTime.getTime() }),
  };
  return {
    at: at.getTime(),
    type,
    tone: toneCodes[tone],
    actorKind: actorCodes[actor.kind],
    userId: actor.kind === 'person' ? actor.userId : null,
    payload: deflateRawSync(JSON.stringify(fitted(payload))),
  };
}

export function decode(row: EventRow, year: number): StoredEvent {
  const { name, email, arrivedAt, deviceTime, ...rest } = JSON.parse(
    inflateRawSync(row.payload).toString('utf8'),
  ) as Payload;
  return {
    id: `${year}:${row.id}`,
    type: row.type,
    at: new Date(row.at),
    tone: toneNames[row.tone] as Tone,
    actor: actorOf(row, name, email),
    ...(arrivedAt !== undefined && { arrivedAt: new Date(arrivedAt) }),
    ...(deviceTime !== undefined && { deviceTime: new Date(deviceTime) }),
    ...rest,
  };
}

const toneNames = Object.keys(toneCodes);

function actorOf(row: EventRow, name?: string, email?: string): Actor {
  if (row.actor_kind === actorCodes.person)
    return { kind: 'person', userId: row.user_id as string, ...(name && { name }) };
  if (row.actor_kind === actorCodes.system) return { kind: 'system' };
  return { kind: 'outsider', ...(email && { email }) };
}

const shortTarget = (target: Target): Target =>
  target.name === undefined ? target : { ...target, name: shortName(target.name) };

const size = (payload: Payload): number => Buffer.byteLength(JSON.stringify(payload));

function fitted(payload: Payload): Payload {
  if (size(payload) <= maxPayloadBytes) return payload;
  const { data, changes } = payload;
  const lighter: Payload = {
    ...payload,
    truncated: true,
    ...(data && { data: Object.fromEntries(Object.keys(data).map((key) => [key, cut])) }),
  };
  if (size(lighter) <= maxPayloadBytes || !changes) return lighter;
  const changed = Object.fromEntries(
    Object.keys(changes).map((key) => [key, { before: cut, after: cut }]),
  );
  return { ...lighter, changes: changed };
}
