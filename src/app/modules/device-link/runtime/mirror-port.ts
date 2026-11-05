// Conectar el espejo con el otro (diseño de 03, § 5): lo que sale va por la conexión que espeja y,
// por el directo, pasa por la confirmación; el saludo dice la versión y el reloj; la foto de la
// computadora va en partes y espera el saludo del otro para ganarle a lo que tenga.
import type { Json } from '../../../platform/mirror/registry.ts';
import { maxMessageBytes } from '../../../platform/peer/transport.ts';
import { deviceLinkSettings } from '../settings.ts';
import { protocolVersion, snapParts, type WireMessage } from '../wire.ts';
import { promote } from './links.ts';
import { isComputerHere, type Link, type Live } from './live.ts';

// Lugar para el sobre de cada parte de la foto.
const envelopeBytes = 512;

// Mandar por esa conexión; lo que no sale (cerrada, o de más de 64 KB) queda en el diario.
function sendOn(live: Live, link: Link, message: WireMessage): void {
  if (!link.transport.send(message as Json)) live.deps.journal.note('not-sent', { t: message.t });
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
  // Otra persona: todo vuelve a su valor inicial, también lo que trajo el servidor (01 · R3.4).
  if (reset) live.deps.mirror.reset();
}

const waitHello = (live: Live) =>
  new Promise<Live['hello']>((resolve) => {
    if (live.hello) return resolve(live.hello);
    const timer = setTimeout(() => {
      live.deps.journal.note('hello-timeout');
      resolve(undefined);
    }, deviceLinkSettings.runtime.helloWaitMs);
    live.helloWaiters.push((hello) => {
      clearTimeout(timer);
      resolve(hello);
    });
  });

// Por el directo, una confirmación de menos de 30 s antes de la foto (§ 7.1): reconectar por un canal
// conservado no manda nada sin preguntarle al servidor. Por el servidor, la pone el servidor.
const confirmed = (live: Live, link: Link) =>
  link.transport.kind !== 'direct' || live.confirm.ensure(deviceLinkSettings.freshMs);

// La foto de la computadora (R6.3): marcada con un reloj más alto que el del otro, gana en los dos.
// Espera el saludo del otro y la confirmación sin frenar la fila de la máquina, y sale solo si sigue
// la misma conexión con el espejo conectado.
export async function sendSnapshot(live: Live, withQueries: boolean): Promise<void> {
  const link = live.current;
  if (!link) return;
  const [hello, ok] = await Promise.all([waitHello(live), confirmed(live, link)]);
  if (!ok) live.deps.journal.note('confirm-failed');
  if (!ok || live.current !== link || !live.deps.mirror.port()) return;
  const photo = live.deps.mirror.snapshot(hello?.clock ?? 0, withQueries);
  for (const part of snapParts(photo, maxMessageBytes - envelopeBytes))
    live.confirm.gate(() => sendOn(live, link, part));
}
