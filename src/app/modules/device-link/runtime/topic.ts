// El tema del vínculo en el canal común (diseño de 03, § 4.4): si el otro está, la señal para
// presentarse, el respaldo y los cambios del vínculo. La computadora lo escucha mientras espera; el
// celular solo se fija una vez (`peek`): si el otro no está, lo deja, y se entera de que llegó por la
// huella `l=` de su próximo pedido. Lo que llega se valida: viene del servidor, pero por la red.
import type { PairingView } from '@ferrebress/shared/contracts/device-link';
import * as z from 'zod/mini';
import { onRelay, onSignal } from './links.ts';
import { type Live, pairingToken } from './live.ts';

const event = z.union([
  z.object({ present: z.boolean(), attempt: z.optional(z.string()) }),
  z.object({
    signal: z.object({ attempt: z.string(), kind: z.enum(['offer', 'answer']), sdp: z.string() }),
  }),
  z.object({ relay: z.array(z.unknown()) }),
  z.object({ pairing: z.custom<PairingView>((value) => typeof value === 'object') }),
]);

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
  const parsed = event.safeParse(data);
  if (!parsed.success) {
    live.deps.journal.note('invalid', { from: 'topic' });
    return;
  }
  const message = parsed.data;
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
