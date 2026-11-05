// Abrir y cerrar las conexiones con el otro (diseño de 03, § 4): el directo, que la computadora ofrece
// y el celular responde, al presentarse o al probar desde el respaldo; el respaldo por el servidor; y
// el directo dormido, que se conserva unos minutos sin espejar. Ninguna espera bloquea los pasos de la
// máquina: lo que tarda avisa con un evento cuando termina.
import { fingerprintOf } from '@ferrebress/shared/peer/candidates';
import { createDirect, type Direct } from '../../../platform/peer/direct.ts';
import { createRelayed } from '../../../platform/peer/relayed.ts';
import type { Transport } from '../../../platform/peer/transport.ts';
import type { Attempt } from '../machine/types.ts';
import { deviceLinkSettings } from '../settings.ts';
import { createSnapAssembler } from '../wire.ts';
import { type IceReport, isComputerHere, type Link, type Live, shut } from './live.ts';
import { listen } from './messages.ts';

const inboxBatches = 20;

function newLink(live: Live, attempt: Attempt, transport: Transport, extra: Partial<Link> = {}) {
  live.hello = undefined;
  return listen(live, { attempt, transport, assemble: createSnapAssembler(), ...extra });
}

// Cuántas direcciones mandó y en qué quedó ICE: números, sin direcciones.
function iceOf(direct: Direct, sdp: string): IceReport {
  const candidates = sdp.split(/\r?\n/).filter((line) => line.startsWith('a=candidate'));
  const mdns = candidates.filter((line) => line.includes('.local')).length;
  return { host: candidates.length - mdns, mdns, pairs: 0, state: direct.ice() };
}

// Si el estado todavía espera ese directo: presentándose, o probando desde el respaldo.
function stillWanted(live: Live, attempt: Attempt, probing: boolean): boolean {
  const state = live.state();
  if (!('attempt' in state) || state.attempt !== attempt) return false;
  return probing ? state.kind === 'relayed' && state.probe === 'trying' : state.kind === 'meeting';
}

// Lo que se abrió para un intento que ya no está: se cierra, así no queda un directo vivo sin usar.
function drop(live: Live, link: Link): void {
  shut(link);
  if (live.opening === link) live.opening = undefined;
}

async function startDirect(
  live: Live,
  attempt: Attempt,
  probing: boolean,
  peerFingerprint?: string,
) {
  shut(live.opening);
  live.opening = undefined;
  const connection = await live.deps.rtc();
  if (!stillWanted(live, attempt, probing)) {
    connection.close();
    return undefined;
  }
  const direct = createDirect({
    connection,
    signal: async (kind, sdp) => {
      const sent = await live.deps.api('/api/device-link/signal', { attempt, kind, sdp });
      if (!sent.ok) live.deps.journal.note('signal-failed', { error: sent.error });
    },
  });
  const extra = peerFingerprint ? { direct, peerFingerprint } : { direct };
  const link = newLink(live, attempt, direct.transport, extra);
  live.opening = link;
  return { link, direct, connection };
}

// No abrió: se guarda por qué, para el aviso al servidor (§ 15.2), y se suelta.
function failed(live: Live, attempt: Attempt, direct: Direct, sdp: string): void {
  live.failedIce = iceOf(direct, sdp);
  live.opening = undefined;
  live.deps.journal.note('ice-timeout', { a: attempt, ice: direct.ice() });
}

// La computadora ofrece. Al presentarse, si no abre, se pasa al respaldo; al probar, se dice si salió.
export function openDirect(live: Live, attempt: Attempt, probing: boolean): void {
  void (async () => {
    const started = await startDirect(live, attempt, probing);
    if (!started) return;
    const { link, direct, connection } = started;
    const ok = await direct.offer();
    if (live.opening !== link || !stillWanted(live, attempt, probing)) return drop(live, link);
    if (!ok) failed(live, attempt, direct, connection.localDescription());
    opened(live, attempt, probing, ok);
  })();
}

// Lo que pasó con el directo, a la máquina: al probar, el resultado; al presentarse, si abrió.
const opened = (live: Live, attempt: Attempt, probing: boolean, ok: boolean) =>
  live.dispatch(
    probing
      ? { type: 'probeResult', attempt, ok }
      : { type: ok ? 'directUp' : 'directFailed', attempt },
  );

async function respond(live: Live, offer: { attempt: Attempt; sdp: string }, probing: boolean) {
  const started = await startDirect(live, offer.attempt, probing, fingerprintOf(offer.sdp));
  if (!started) return;
  const { link, direct } = started;
  const ok = await direct.answer(offer.sdp);
  if (!ok || live.opening !== link || !stillWanted(live, offer.attempt, probing))
    return drop(live, link);
  opened(live, offer.attempt, probing, true);
}

// El celular responde la oferta que espera: al presentarse, o al probar desde el respaldo.
export function answerOffer(live: Live): void {
  const { offer } = live;
  const state = live.state();
  if (!offer || !('attempt' in state) || state.attempt !== offer.attempt) return;
  const probing = state.kind === 'relayed' && state.probe === 'trying';
  if (state.kind !== 'meeting' && !probing) return;
  live.offer = undefined;
  void respond(live, offer, probing);
}

// Lo que llega por el tema: la oferta se guarda hasta que el celular la espere; la respuesta, al
// directo que la computadora está abriendo con ese intento.
export function onSignal(live: Live, signal: { attempt: string; kind: string; sdp: string }) {
  if (signal.kind === 'offer') {
    live.offer = { attempt: signal.attempt, sdp: signal.sdp };
    answerOffer(live);
    return;
  }
  const opening = live.opening;
  if (!opening?.direct || opening.attempt !== signal.attempt) return;
  opening.peerFingerprint = fingerprintOf(signal.sdp) as string;
  void opening.direct.accept(signal.sdp);
}

// Por el servidor (§ 4.3): lo que llegó antes de abrirlo espera; un `give-up` sin respaldo abierto
// es lo que hace que el celular lo abra.
export function onRelay(live: Live, batch: unknown[]): void {
  if (live.relayReceiver) {
    live.relayReceiver(batch);
    return;
  }
  // Solo se guarda mientras se presentan: es lo que el otro mandó por el respaldo antes que este
  // abriera el suyo. Fuera de eso, es de una conexión que ya no está (4.5).
  if (live.state().kind === 'meeting' && live.relayInbox.length < inboxBatches)
    live.relayInbox.push(batch);
  const givesUp = batch.some((m) => (m as { t?: unknown } | null)?.t === 'give-up');
  if (givesUp)
    live.enqueue(() => {
      const state = live.state();
      if (state.kind === 'meeting') live.dispatch({ type: 'directFailed', attempt: state.attempt });
    });
}

export function openRelayed(live: Live, attempt: Attempt): void {
  shut(live.opening);
  live.opening = undefined;
  let receiver: ((batch: unknown[]) => void) | undefined;
  const relayed = createRelayed({
    send: async (messages) => (await live.deps.api('/api/device-link/relay', { messages })).ok,
    subscribe: (receive) => {
      receiver = receive as (batch: unknown[]) => void;
      return () => {
        live.relayReceiver = undefined;
      };
    },
  });
  live.current = newLink(live, attempt, relayed.transport);
  // Recién ahora hay quien escuche: lo que llegó antes se entrega en orden.
  live.relayReceiver = receiver;
  for (const batch of live.relayInbox.splice(0)) receiver?.(batch);
  if (isComputerHere(live)) relayed.transport.send({ t: 'give-up' });
}

// Cerrar todo, o conservar: el respaldo, al pasar al directo que se probó, se cierra; el directo queda
// dormido unos minutos (E22).
export function closeTransport(live: Live, keep: boolean): void {
  const current = live.current;
  live.current = undefined;
  live.relayInbox = [];
  if (keep && current?.transport.kind === 'direct') {
    sleep(live, current);
    return;
  }
  shut(current);
  if (keep) return;
  shut(live.opening);
  shut(live.dormant);
  if (live.dormant) clearTimeout(live.dormant.timer);
  Object.assign(live, {
    opening: undefined,
    dormant: undefined,
    offer: undefined,
    hello: undefined,
  });
}

function sleep(live: Live, link: Link): void {
  if (live.dormant) clearTimeout(live.dormant.timer);
  shut(live.dormant);
  // Promoverlo o cerrar todo frena este plazo: si vence, sigue siendo el dormido.
  const timer = setTimeout(() => {
    live.dormant = undefined;
    shut(link);
    live.dispatch({ type: 'dormantLost' });
  }, deviceLinkSettings.runtime.dormantMs);
  const dormant = Object.assign(link, { timer });
  live.dormant = dormant;
}

// La conexión que espeja con el intento de ahora: la que ya espejaba, la que se abrió o la dormida.
export function promote(live: Live, attempt: Attempt): Link | undefined {
  if (live.current?.attempt === attempt) return live.current;
  if (live.opening?.attempt === attempt) {
    live.current = live.opening;
    live.opening = undefined;
  } else if (live.dormant?.attempt === attempt) {
    clearTimeout(live.dormant.timer);
    live.current = live.dormant;
    live.dormant = undefined;
  }
  return live.current;
}
