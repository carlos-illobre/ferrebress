// Las transiciones de llegar y de irse (diseño de 03, § 8.3): lo que dice el servidor, la sesión, el
// otro que llega o se va, y el directo que abre o no.
import type { PairingView } from '@ferrebress/shared/contracts/device-link';
import { onPause, onResume } from './stay.ts';
import {
  type Attempt,
  type Command,
  connected,
  type GoneWhy,
  isComputer,
  leaving,
  listenWhilePaused,
  type PairingState,
  pairingOf,
  type Step,
  same,
  toWaiting,
} from './types.ts';

// Ya no hay vínculo (R2.3, R2.4): se suelta todo y cada uno sigue por su lado.
function onNoPairing(state: PairingState): Step {
  if (state.kind === 'unpaired') return same(state);
  const bye: Command[] = pairingOf(state) ? [{ do: 'bye', why: 'unpair' }] : [];
  const commands = [...bye, ...leaving(state), { do: 'strip', mark: 'unpaired' } as Command];
  return { state: { kind: 'unpaired' }, commands };
}

// Otro vínculo (un reemplazo, E05, E06, E08): deja el de ahora y espera al otro con el nuevo.
function onNewPairing(state: PairingState, pairing: PairingView): Step {
  const bye: Command[] = pairingOf(state) ? [{ do: 'bye', why: 'replaced' }] : [];
  if (pairing.paused)
    return {
      state: { kind: 'paused', pairing },
      commands: [...bye, ...leaving(state), ...listenWhilePaused(pairing)],
    };
  return toWaiting(pairing, [...bye, ...leaving(state)]);
}

// Lo que dice el servidor del vínculo: ninguno, otro, o el mismo, quizás en pausa o ya no.
export function onServerSaid(state: PairingState, pairing: PairingView | null): Step {
  if (!pairing) return onNoPairing(state);
  if (pairingOf(state)?.id !== pairing.id) return onNewPairing(state, pairing);
  if (pairing.paused && state.kind !== 'paused') return onPause(state, 'peer');
  if (!pairing.paused && state.kind === 'paused') return onResume(state, 'peer');
  return { state: { ...state, pairing } as PairingState, commands: [] };
}

// Salir, la sesión cerrada o vencida, u otra persona: antes que todo, se suelta lo del otro (R2.1).
export function onSessionLost(state: PairingState, samePerson: boolean): Step {
  if (state.kind === 'asleep') return same(state);
  const bye: Command[] = pairingOf(state) ? [{ do: 'bye', why: 'signout' }] : [];
  const commands: Command[] = [...bye, { do: 'closeTransport' }, { do: 'unsubscribe' }];
  return {
    state: { kind: 'asleep' },
    commands: [...commands, { do: 'detachMirror', reset: !samePerson }],
  };
}

// El otro llegó: la computadora ofrece el directo; el celular espera la oferta. Una presentación
// nueva en medio de otra la reemplaza: el servidor los presentó de nuevo (el otro volvió a escuchar).
export function onPeerPresent(state: PairingState, attempt: Attempt): Step {
  const again = state.kind === 'meeting' && state.attempt !== attempt;
  if (state.kind !== 'waiting' && !again) return same(state);
  const open: Command = isComputer(state.pairing)
    ? { do: 'openDirect', attempt }
    : { do: 'awaitOffer', attempt };
  const drop: Command[] = again ? [{ do: 'closeTransport' }] : [];
  return { state: { kind: 'meeting', pairing: state.pairing, attempt }, commands: [...drop, open] };
}

// El otro volvió por el directo que se conservó dormido.
export function onPeerBack(state: PairingState, attempt: Attempt): Step {
  if (state.kind !== 'waiting' || state.dormant !== attempt) return same(state);
  return connected(state.pairing, attempt, 'direct');
}

// El directo abrió, o no se logró y se pasa al respaldo (R3.2).
export function onDirect(
  state: PairingState,
  type: 'directUp' | 'directFailed',
  attempt: Attempt,
): Step {
  if (state.kind !== 'meeting' || state.attempt !== attempt) return same(state);
  if (type === 'directUp') return connected(state.pairing, attempt, 'direct');
  const relayed = connected(state.pairing, attempt, 'relayed');
  const report: Command[] = isComputer(state.pairing)
    ? [{ do: 'report', attempt, outcome: 'direct-failed' }]
    : [];
  return { ...relayed, commands: [...report, { do: 'openRelayed', attempt }, ...relayed.commands] };
}

// La conexión de ahora: la que espeja o se abre, o el directo que la pausa conservó.
const attemptNow = (state: PairingState) =>
  'attempt' in state ? state.attempt : state.kind === 'paused' ? state.kept : undefined;

// En pausa, se cortó el directo conservado: la pausa sigue sin él (reconectar ya no puede usarlo).
const keptLost = (pairing: PairingView): Step => ({
  state: { kind: 'paused', pairing },
  commands: [{ do: 'closeTransport' }, ...listenWhilePaused(pairing)],
});

// El otro se fue. Oculto, el directo queda dormido unos minutos; cortado, se confirma si hay internet.
// Un aviso de una conexión anterior no cambia nada.
export function onPeerGone(state: PairingState, why: GoneWhy, attempt?: Attempt): Step {
  if (attempt !== undefined && attempt !== attemptNow(state)) return same(state);
  if (why === 'version') return onOtherVersion(state);
  if (state.kind === 'paused' && state.kept) return keptLost(state.pairing);
  if (state.kind !== 'meeting' && state.kind !== 'direct' && state.kind !== 'relayed')
    return same(state);
  const detach: Command = { do: 'detachMirror', reset: false };
  if (state.kind === 'direct' && why === 'hidden') {
    const asleep = toWaiting(state.pairing, [detach, { do: 'closeTransport', keep: true }]);
    return {
      ...asleep,
      state: { kind: 'waiting', pairing: state.pairing, dormant: state.attempt },
    };
  }
  const check: Command[] = why === 'lost' ? [{ do: 'check' }] : [];
  return toWaiting(state.pairing, [detach, { do: 'closeTransport' }, ...check]);
}

// Otra versión (R6.7, § 8.4): no espejan y el de la versión vieja se entera. Quedan esperando sin
// escuchar, para no presentarse una y otra vez: cuando el otro cambie (se actualizó), la huella `l=`
// lo dice y se vuelven a presentar.
function onOtherVersion(state: PairingState): Step {
  const live = ['waiting', 'meeting', 'direct', 'relayed'] as const;
  if (!live.includes(state.kind as (typeof live)[number])) return same(state);
  const pairing = pairingOf(state) as PairingView;
  return {
    state: { kind: 'waiting', pairing, why: 'version' },
    commands: [...leaving(state), { do: 'newVersion' }, { do: 'strip', mark: 'waiting' }],
  };
}
