// El tema del vínculo en el canal común (diseño de 03, § 4.4): si el otro está, la señal para
// presentarse, el respaldo y los cambios del vínculo. La computadora lo escucha mientras espera; el
// celular solo se fija una vez (`peek`): si el otro no está, lo deja, y se entera de que llegó por la
// huella `l=` de su próximo pedido. Lo que llega se valida: viene del servidor, pero por la red.
import { sides } from '@ferrebress/shared/contracts/pairing';
import * as z from 'zod/mini';
import { flag, oneOf } from '../../../platform/schema.ts';
import { onRelay, onSignal } from './links.ts';
import { type Live, pairingToken } from './live.ts';

// Lo que dice el tema, según qué trae.
const shapes = {
  present: z.object({ present: flag, attempt: z.optional(z.string()) }),
  signal: z.object({
    signal: z.object({ attempt: z.string(), kind: oneOf(['offer', 'answer']), sdp: z.string() }),
  }),
  relay: z.object({ relay: z.array(z.unknown()) }),
  pairing: z.object({
    pairing: z.object({
      id: z.string(),
      side: oneOf(sides),
      other: z.object({ label: z.string() }),
      since: z.number(),
      lastMirrored: z.number(),
      paused: flag,
    }),
  }),
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
  // El celular se fijó y el otro no está: deja el tema. Por el respaldo, el otro se fue.
  live.enqueue(() => {
    const state = live.state();
    if (topic.peeking && live.topic === topic && state.kind === 'waiting') unsubscribe(live);
    else if (state.kind === 'relayed') live.dispatch({ type: 'peerGone', why: 'lost' });
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
  live.topic?.stop();
  live.topic = undefined;
}
