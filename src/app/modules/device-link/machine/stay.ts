// Las transiciones de quedarse (diseño de 03, § 8.3): internet que se va y vuelve, desconectar y
// reconectar, probar el directo y la pestaña que se oculta o vuelve.
import {
  type Attempt,
  type Command,
  connected,
  isComputer,
  leaving,
  listenWhilePaused,
  type PairingState,
  pairingOf,
  type Step,
  same,
  toWaiting,
} from './types.ts';

// Sin internet (R3.4): el directo sigue; lo demás espera a que vuelva, con el reintento de siempre.
export function onInternet(state: PairingState, back: boolean): Step {
  const pairing = pairingOf(state);
  if (!pairing) return same(state);
  if (back) return state.kind === 'offline' ? toWaiting(pairing) : same(state);
  if (state.kind === 'direct' || state.kind === 'paused' || state.kind === 'offline')
    return same(state);
  return {
    state: { kind: 'offline', pairing },
    commands: [...leaving(state), { do: 'retryInternet' }, { do: 'strip', mark: 'offline' }],
  };
}

// Desconectar (R5.1): cada uno por su lado; el directo que había se conserva sin espejar.
export function onPause(state: PairingState, from: 'here' | 'peer'): Step {
  const pairing = pairingOf(state);
  if (!pairing || state.kind === 'paused' || state.kind === 'away') return same(state);
  const kept = state.kind === 'direct' ? state.attempt : undefined;
  const here: Command[] =
    from === 'here'
      ? [
          { do: 'post', path: 'pause' },
          { do: 'send', message: 'pause' },
        ]
      : [];
  const commands: Command[] = [
    ...here,
    { do: 'detachMirror', reset: false },
    { do: 'strip', mark: 'paused' },
  ];
  if (!kept) commands.push({ do: 'closeTransport' }, ...listenWhilePaused(pairing));
  const paused = { ...pairing, paused: true };
  return {
    state: kept ? { kind: 'paused', pairing: paused, kept } : { kind: 'paused', pairing: paused },
    commands,
  };
}

// Reconectar (R5.2): con el directo conservado, vuelve el espejo y manda la computadora (E29).
export function onResume(state: PairingState, from: 'here' | 'peer'): Step {
  if (state.kind !== 'paused') return same(state);
  const pairing = { ...state.pairing, paused: false };
  const here: Command[] = from === 'here' ? [{ do: 'post', path: 'resume' }] : [];
  if (!state.kept) return toWaiting(pairing, here);
  const resumed = connected(pairing, state.kept, 'direct');
  const tell: Command[] = from === 'here' ? [{ do: 'send', message: 'resume' }] : [];
  return { ...resumed, commands: [...here, ...tell, ...resumed.commands] };
}

// Probar la conexión directa desde el respaldo (R3.3, E19): sin cortar el respaldo.
export function onProbe(state: PairingState): Step {
  if (state.kind !== 'relayed' || state.probe === 'trying') return same(state);
  const offer: Command[] = isComputer(state.pairing)
    ? [{ do: 'probeDirect', attempt: state.attempt }]
    : [];
  return {
    state: { ...state, probe: 'trying' },
    commands: [{ do: 'send', message: 'probe' }, ...offer],
  };
}

export function onProbeResult(state: PairingState, attempt: Attempt, ok: boolean): Step {
  if (state.kind !== 'relayed' || state.probe !== 'trying' || state.attempt !== attempt)
    return same(state);
  if (!ok)
    return {
      state: { ...state, probe: 'failed' },
      commands: [{ do: 'report', attempt, outcome: 'probe-failed' }],
    };
  const direct = connected(state.pairing, attempt, 'direct');
  return { ...direct, commands: [{ do: 'closeTransport', keep: true }, ...direct.commands] };
}

// Esta pestaña se ocultó o perdió el candado (R6.4): oculta, el directo queda dormido unos minutos.
export function onTabAway(state: PairingState, why: 'hidden' | 'handover'): Step {
  const pairing = pairingOf(state);
  if (!pairing || state.kind === 'away') return same(state);
  const keep = state.kind === 'direct' && why === 'hidden';
  const commands: Command[] = [
    { do: 'bye', why },
    { do: 'unsubscribe' },
    { do: 'detachMirror', reset: false },
    keep ? { do: 'closeTransport', keep: true } : { do: 'closeTransport' },
  ];
  const away: PairingState = keep
    ? { kind: 'away', pairing, dormant: state.attempt }
    : { kind: 'away', pairing };
  return { state: away, commands };
}

// Al volver la pestaña: con el directo dormido, se saluda por él (E22); en pausa, sigue en pausa
// (R5.1: volver no reconecta); si no, se pregunta cómo está el vínculo y se presenta de nuevo.
export function onTabBack(state: PairingState): Step {
  if (state.kind !== 'away') return same(state);
  const { pairing, dormant } = state;
  if (pairing.paused)
    return {
      state: { kind: 'paused', pairing },
      commands: [...listenWhilePaused(pairing), { do: 'check' }, { do: 'strip', mark: 'paused' }],
    };
  if (!dormant) return toWaiting(pairing, [{ do: 'check' }]);
  return {
    state: { kind: 'waiting', pairing, dormant },
    commands: [
      { do: 'send', message: 'hello' },
      { do: 'strip', mark: 'waiting' },
    ],
  };
}

// El directo dormido ya no sirve: se espera al otro como siempre.
export function onDormantLost(state: PairingState): Step {
  if (state.kind === 'away' && state.dormant)
    return { state: { kind: 'away', pairing: state.pairing }, commands: [] };
  if (state.kind !== 'waiting' || !state.dormant) return same(state);
  return toWaiting(state.pairing, [{ do: 'check' }]);
}
