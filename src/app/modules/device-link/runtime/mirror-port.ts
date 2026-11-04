// Conectar el espejo con el otro (diseño de 03, § 5): lo que sale va por la conexión que espeja y,
// por el directo, pasa por la confirmación; el saludo dice la versión y el reloj; la foto de la
// computadora va en partes y espera el saludo del otro para ganarle a lo que tenga.
import type { Json } from '../../../platform/mirror/registry.ts';
import { maxMessageBytes } from '../../../platform/peer/transport.ts';
import { protocolVersion, snapParts, type WireMessage } from '../wire.ts';
import { promote } from './links.ts';
import { isComputerHere, type Link, type Live, runtimeSettings } from './live.ts';

// Lugar para el sobre de cada parte de la foto.
const envelopeBytes = 512;

function sendOn(live: Live, link: Link, message: WireMessage): void {
  if (!link.transport.send(message as Json)) live.deps.journal.note('too-large', { t: message.t });
}

export function sendHello(live: Live, link: Link | undefined): void {
  if (!link) return;
  const { appVersion, mirror } = live.deps;
  sendOn(live, link, {
    t: 'hello',
    v: protocolVersion,
    app: appVersion,
    clock: mirror.highestClock(),
  });
}

export function attachMirror(live: Live, over: 'direct' | 'relayed'): void {
  const state = live.state();
  const link = 'attempt' in state ? promote(live, state.attempt) : undefined;
  if (!link) {
    live.deps.journal.note('no-link', { over });
    return;
  }
  // Por el directo, la huella del otro; sin ella, la confirmación dice que no (nada sale).
  live.confirm.begin(over === 'direct' ? (link.peerFingerprint ?? '') : undefined);
  live.deps.mirror.attach({
    leader: isComputerHere(live),
    over,
    send: (patches) => live.confirm.gate(() => sendOn(live, link, { t: 'patch', p: patches })),
  });
  sendHello(live, link);
}

export function detachMirror(live: Live, reset: boolean): void {
  live.deps.mirror.detach();
  live.confirm.end();
  // Otra persona: lo que vino del otro vuelve a su valor inicial (01 · R3.4).
  if (reset) live.deps.mirror.adopt([]);
}

const waitHello = (live: Live) =>
  new Promise<Live['hello']>((resolve) => {
    if (live.hello) return resolve(live.hello);
    const timer = setTimeout(() => {
      live.deps.journal.note('hello-timeout');
      resolve(undefined);
    }, runtimeSettings.helloWaitMs);
    live.helloWaiters.push((hello) => {
      clearTimeout(timer);
      resolve(hello);
    });
  });

// La foto de la computadora (R6.3): marcada con un reloj más alto que el del otro, gana en los dos.
export async function sendSnapshot(live: Live, withQueries: boolean): Promise<void> {
  const link = live.current;
  if (!link) return;
  const hello = await waitHello(live);
  if (live.current !== link) return;
  const photo = live.deps.mirror.snapshot(hello?.clock ?? 0, withQueries);
  for (const part of snapParts(photo, maxMessageBytes - envelopeBytes))
    live.confirm.gate(() => sendOn(live, link, part));
}

// La confirmación antes de la foto: solo por el directo (por el servidor la pone el servidor).
export async function confirmNow(live: Live, maxAgeMs: number): Promise<void> {
  if (live.current?.transport.kind !== 'direct') return;
  const ok = await live.confirm.ensure(maxAgeMs);
  if (!ok) live.deps.journal.note('confirm-failed');
}
