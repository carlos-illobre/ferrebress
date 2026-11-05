// Los estados, los eventos y los comandos del vínculo (diseño de 03, § 8.1), y lo que comparten las
// transiciones: esperar al otro, conectarse y dejar el vínculo de ahora.
import type { PairingView } from '@ferrebress/shared/contracts/device-link';

export type Attempt = string;
export type GoneWhy =
  | 'hidden'
  | 'signout'
  | 'signed-out'
  | 'lost'
  | 'handover'
  | 'replaced'
  | 'unpair'
  | 'version';

export type PairingState =
  | { kind: 'asleep' }
  | { kind: 'unpaired' }
  | { kind: 'waiting'; pairing: PairingView; dormant?: Attempt; why?: 'version' }
  | { kind: 'meeting'; pairing: PairingView; attempt: Attempt }
  | { kind: 'direct'; pairing: PairingView; attempt: Attempt }
  | { kind: 'relayed'; pairing: PairingView; attempt: Attempt; probe?: 'trying' | 'failed' }
  | { kind: 'paused'; pairing: PairingView; kept?: Attempt }
  | { kind: 'offline'; pairing: PairingView }
  | { kind: 'away'; pairing: PairingView; dormant?: Attempt };

export type PairingEvent =
  | { type: 'serverSaid'; pairing: PairingView | null }
  | { type: 'sessionLost'; samePerson: boolean }
  | { type: 'peerPresent'; attempt: Attempt }
  | { type: 'peerBack'; attempt: Attempt }
  // `attempt`: de qué conexión es el aviso; uno de una conexión anterior no cambia nada.
  | { type: 'peerGone'; why: GoneWhy; attempt?: Attempt }
  | { type: 'directUp' | 'directFailed' | 'relayUp'; attempt: Attempt }
  | { type: 'internetLost' }
  | { type: 'internetBack' }
  | { type: 'pause' | 'resume'; from: 'here' | 'peer' }
  | { type: 'probe' }
  | { type: 'probeResult'; attempt: Attempt; ok: boolean }
  | { type: 'tabAway'; why: 'hidden' | 'handover' }
  | { type: 'tabBack' }
  // El directo que se conservó dormido se cerró o venció (5 minutos).
  | { type: 'dormantLost' };

// Lo que hay que hacer; lo corre `runtime.ts`.
export type Command =
  | { do: 'subscribe' | 'unsubscribe' | 'peek' }
  | { do: 'openDirect' | 'awaitOffer' | 'openRelayed' | 'probeDirect'; attempt: Attempt }
  | { do: 'closeTransport'; keep?: true }
  | { do: 'bye'; why: GoneWhy }
  | { do: 'send'; message: 'pause' | 'resume' | 'probe' | 'hello' }
  | { do: 'snapshot'; withQueries: boolean }
  | { do: 'report'; attempt: Attempt; outcome: 'direct-failed' | 'probe-failed' }
  | { do: 'post'; path: 'pause' | 'resume' }
  | { do: 'attachMirror'; over: 'direct' | 'relayed' }
  | { do: 'detachMirror'; reset: boolean }
  | { do: 'strip'; mark: PairingState['kind'] }
  | { do: 'check' | 'retryInternet' | 'newVersion' };

export type Step = { state: PairingState; commands: Command[]; ignored?: true };

export const isComputer = (pairing: PairingView) => pairing.side === 'computer';
export const pairingOf = (state: PairingState) => ('pairing' in state ? state.pairing : undefined);
export const same = (state: PairingState): Step => ({ state, commands: [], ignored: true });

// Entrar a esperar al otro: la computadora escucha el tema; el celular solo se fija una vez.
export const toWaiting = (pairing: PairingView, extra: Command[] = []): Step => ({
  state: { kind: 'waiting', pairing },
  commands: [
    ...extra,
    { do: isComputer(pairing) ? 'subscribe' : 'peek' },
    { do: 'strip', mark: 'waiting' },
  ],
});

// En pausa sin el directo conservado, la computadora a la vista sigue escuchando el tema: así se
// entera en el momento de que el celular tocó «Reconectar» (E29). El celular no escucha.
export const listenWhilePaused = (pairing: PairingView): Command[] =>
  isComputer(pairing) ? [{ do: 'subscribe' }] : [{ do: 'unsubscribe' }];

// Dejar el vínculo de ahora: cerrar el transporte, dejar de escuchar y desconectar el espejo.
export const leaving = (state: PairingState): Command[] =>
  pairingOf(state)
    ? [{ do: 'closeTransport' }, { do: 'unsubscribe' }, { do: 'detachMirror', reset: false }]
    : [];

// Conectados: el espejo se conecta y la computadora manda la foto (que pide antes una confirmación
// de menos de 30 s, § 7.1).
export function connected(
  pairing: PairingView,
  attempt: Attempt,
  over: 'direct' | 'relayed',
): Step {
  const leader: Command[] = isComputer(pairing)
    ? [{ do: 'snapshot', withQueries: over === 'direct' }]
    : [];
  const commands: Command[] = [
    { do: 'attachMirror', over },
    ...leader,
    { do: 'strip', mark: over },
  ];
  if (over === 'direct') commands.unshift({ do: 'unsubscribe' });
  return { state: { kind: over, pairing, attempt }, commands };
}
