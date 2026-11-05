// Lo que llega del otro por una conexión (diseño de 03, § 4.4): se valida con `wire.ts` y cada mensaje
// tiene quien lo maneja, uno por tipo (sumar un tipo sin manejarlo no compila). Lo que entra al espejo
// corre en orden con los pasos de la máquina y pasa por la confirmación; el saludo se anota enseguida,
// porque la foto lo espera. Lo que llega por un directo dormido lo despierta.
import type { Json } from '../../../platform/mirror/registry.ts';
import { read, type WireMessage } from '../wire.ts';
import { type Link, type Live, shut } from './live.ts';

type Of<T extends WireMessage['t']> = Extract<WireMessage, { t: T }>;
type Handlers = { [T in WireMessage['t']]: (live: Live, link: Link, message: Of<T>) => void };

// Lo del espejo, solo por la conexión que espeja y con la confirmación al día.
const intoMirror = (live: Live, link: Link, apply: () => void) =>
  live.enqueue(() => {
    if (link === live.current && live.deps.mirror.port()) live.confirm.gate(apply);
    else live.deps.journal.note('ignored', { why: 'not-mirroring' });
  });

const handlers: Handlers = {
  hello(live, link, message) {
    live.hello = message;
    for (const waiter of live.helloWaiters.splice(0)) waiter(message);
    if (message.app !== live.deps.appVersion)
      live.dispatch({ type: 'peerGone', why: 'version', attempt: link.attempt });
  },
  bye(live, link, message) {
    live.dispatch({ type: 'peerGone', why: message.why, attempt: link.attempt });
    // El otro terminó o reemplazó el vínculo: el servidor dice cuál hay ahora.
    if (message.why === 'unpair' || message.why === 'replaced') void live.check();
  },
  pause: (live) => live.dispatch({ type: 'pause', from: 'peer' }),
  resume: (live) => live.dispatch({ type: 'resume', from: 'peer' }),
  probe: (live) => live.dispatch({ type: 'probe' }),
  // La computadora no logró el directo (§ 4.4): el celular ya pasó al respaldo al verlo llegar por el
  // servidor (`onRelay`), antes de abrir el transporte que lo entrega acá.
  // La computadora no logró el directo que se probaba: el celular deja de esperarlo (E19).
  'give-up': (live, link) => {
    const state = live.state();
    if (state.kind !== 'relayed' || state.probe !== 'trying' || state.attempt !== link.attempt)
      return;
    shut(live.opening);
    live.opening = undefined;
    live.dispatch({ type: 'probeResult', attempt: state.attempt, ok: false });
  },
  patch: (live, link, message) => intoMirror(live, link, () => live.deps.mirror.receive(message.p)),
  snap(live, link, message) {
    const photo = link.assemble(message);
    if (photo) intoMirror(live, link, () => live.deps.mirror.adopt(photo));
  },
};

function receive(live: Live, link: Link, raw: Json): void {
  const received = read(raw);
  if (!received.ok) {
    live.deps.journal.note('unknown-message', { kind: received.kind });
    return;
  }
  const { message } = received;
  // Lo que llega por el directo dormido es que el otro volvió; un adiós no (4.16).
  if (link === live.dormant && message.t !== 'bye')
    live.dispatch({ type: 'peerBack', attempt: link.attempt });
  (handlers[message.t] as (live: Live, link: Link, message: WireMessage) => void)(
    live,
    link,
    message,
  );
}

// Escuchar una conexión: lo que llega y cuándo se corta. Lo que se cierra desde acá deja de
// escucharse antes (`shut`), así que no avisa.
export function listen(live: Live, link: Omit<Link, 'stop'>): Link {
  const full = link as Link;
  const stops = [
    link.transport.onMessage((raw) => receive(live, full, raw)),
    link.transport.onClose((why) => {
      live.deps.journal.note('transport-closed', { why, kind: link.transport.kind });
      if (full === live.current)
        live.dispatch({ type: 'peerGone', why: 'lost', attempt: link.attempt });
      if (full === live.dormant) {
        clearTimeout(live.dormant.timer);
        live.dormant = undefined;
        live.dispatch({ type: 'dormantLost' });
      }
    }),
  ];
  full.stop = () => {
    for (const stop of stops) stop();
  };
  return full;
}
