// El tema del vínculo en el canal común (diseño de 03, § 4.4): si el otro está, la señal para
// presentarse, el respaldo y los cambios del vínculo. La computadora lo escucha mientras espera; el
// celular solo se fija una vez (`peek`): si el otro no está, lo deja, y se entera de que llegó por la
// huella `l=` de su próximo pedido. Lo que llega se valida: viene del servidor, pero por la red.
import { sides } from '@ferrebress/shared/contracts/pairing';
import * as z from 'zod/mini';
import { flag, oneOf } from '../../../platform/schema.ts';
import { deviceLinkSettings } from '../settings.ts';
import { onRelay, onSignal } from './links.ts';
import { type Live, pairingToken } from './live.ts';

// Lo que dice el tema, según qué trae.
// El vínculo como lo ve este dispositivo: lo dice el tema y lo dice `/api/start`.
export const pairingShape = z.object({
  id: z.string(),
  side: oneOf(sides),
  other: z.object({ label: z.string() }),
  since: z.number(),
  lastMirrored: z.number(),
  expiresAt: z.number(),
  lastsDays: z.number(),
  paused: flag,
});

const shapes = {
  present: z.object({ present: flag, attempt: z.optional(z.string()) }),
  signal: z.object({
    signal: z.object({ attempt: z.string(), kind: oneOf(['offer', 'answer']), sdp: z.string() }),
  }),
  relay: z.object({ relay: z.array(z.unknown()) }),
  pairing: z.object({ pairing: pairingShape }),
};
const kinds = Object.keys(shapes) as (keyof typeof shapes)[];

function parse(data: unknown) {
  const kind = kinds.find((key) => data !== null && typeof data === 'object' && key in data);
  const parsed = kind && shapes[kind].safeParse(data);
  return parsed?.success ? parsed.data : undefined;
}

type Topic = NonNullable<Live['topic']>;

function onPresence(live: Live, topic: Topic, present: boolean, attempt?: string): void {
  if (present && attempt) {
    topic.peeking = false;
    live.dispatch({ type: 'peerPresent', attempt });
    return;
  }
  // El celular se fijó y el otro no está: lo espera un rato y deja el tema. Por el respaldo, el otro
  // se fue.
  if (topic.peeking) {
    setTimeout(() => leaveIfAlone(live, topic), deviceLinkSettings.runtime.peekMs);
    return;
  }
  live.enqueue(() => {
    if (live.state().kind === 'relayed') live.dispatch({ type: 'peerGone', why: 'lost' });
  });
}

function leaveIfAlone(live: Live, topic: Topic): void {
  live.enqueue(() => {
    if (topic.peeking) unsubscribe(live);
  });
}

function onEvent(live: Live, topic: Topic, data: unknown): void {
  const message = parse(data);
  if (!message) {
    live.deps.journal.note('invalid', { from: 'topic' });
    return;
  }
  if ('present' in message) onPresence(live, topic, message.present, message.attempt);
  else if ('signal' in message) onSignal(live, message.signal);
  else if ('relay' in message) onRelay(live, message.relay);
  else live.dispatch({ type: 'serverSaid', pairing: message.pairing });
}

export function subscribe(live: Live, peeking: boolean): void {
  const state = live.state();
  if (!('pairing' in state)) return;
  if (live.topic) {
    if (!peeking) live.topic.peeking = false;
    return;
  }
  // Lo que llega es siempre después de pedirlo: para entonces `topic` ya existe.
  const stop = live.deps.want(pairingToken(state.pairing), {
    onEvent: (data) => onEvent(live, topic, data),
    // No lo dejan escuchar, o el servidor soltó la clave: el vínculo cambió.
    onRefused: () => void live.check(),
    onDropped: () => void live.check(),
  });
  const topic: Topic = { peeking, stop };
  live.topic = topic;
}

export function unsubscribe(live: Live): void {
  // Ya no se fija: lo que esperaba a ver si llegaba el otro no toca un tema que no es este.
  if (live.topic) live.topic.peeking = false;
  live.topic?.stop();
  live.topic = undefined;
}
