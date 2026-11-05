// El vínculo vivo en esta pestaña (diseño de 03, § 2.2): convierte lo que pasa en eventos, los pasa
// por la máquina de estados, anota cada paso en el diario y corre sus comandos. Todo en una sola fila:
// un evento se procesa entero, con sus comandos, antes del siguiente, así el orden no depende de qué
// respuesta llegó primero. Lo que tarda (abrir el directo, esperar la foto) no frena la fila: avisa
// con otro evento cuando termina. Las dependencias llegan de afuera, para probarlo con dos de estos.
import type { CheckResponse } from '@ferrebress/shared/contracts/device-link';
import { createStore, type Store } from '../../platform/store.ts';
import { createConfirm } from './confirm.ts';
import type { PairingEvent, PairingState } from './machine/types.ts';
import { run } from './runtime/commands.ts';
import { answerOffer, closeTransport } from './runtime/links.ts';
import type { Deps, Live } from './runtime/live.ts';
import { detachMirror } from './runtime/mirror-port.ts';
import { subscribe, unsubscribe } from './runtime/topic.ts';
import { step } from './state.ts';

export type { Deps } from './runtime/live.ts';

// Un paso: la máquina dice el estado y los comandos; se anota, se cambia y se corren en orden.
async function advance(live: Live, state: Store<PairingState>, event: PairingEvent) {
  const next = step(state.get(), event);
  live.deps.journal.step(event, next.state, next.commands, next.ignored);
  state.set(next.state);
  for (const command of next.commands) await run(live, command);
  // Una oferta que llegó antes que el celular la esperara.
  answerOffer(live);
}

function createLive(deps: Deps, state: Store<PairingState>): Live {
  let queue = Promise.resolve();
  const live = {
    deps,
    state: () => state.get(),
    relayInbox: [],
    helloWaiters: [],
    failedIce: { host: 0, mdns: 0, pairs: 0, state: 'new' },
    enqueue(job: () => void | Promise<void>) {
      queue = queue.then(job).catch((error: unknown) => {
        deps.journal.note('error', { what: String(error).slice(0, 80) });
      });
    },
    dispatch: (event: PairingEvent) => live.enqueue(() => advance(live, state, event)),
    async check() {
      const result = await deps.api<CheckResponse>('/api/device-link/check');
      if (result.ok) live.dispatch({ type: 'serverSaid', pairing: result.data.pairing ?? null });
      else if (result.error === 'offline') live.dispatch({ type: 'internetLost' });
    },
  } as unknown as Live;
  live.confirm = createConfirm({
    check: (fingerprint) =>
      deps.api<CheckResponse>(`/api/device-link/check?fp=${encodeURIComponent(fingerprint)}`),
    onVerdict: (verdict, pairing) =>
      live.dispatch(
        verdict === 'none'
          ? { type: 'serverSaid', pairing: pairing ?? null }
          : { type: 'peerGone', why: 'signed-out' },
      ),
  });
  return live;
}

// Cambió la huella `l=` del vínculo (§ 3.5): lo que sale por el directo espera una confirmación nueva;
// esperando sin escuchar, el otro pudo haber llegado y se
// mira (la versión vieja no: se presentaría una y otra vez); si no, se pregunta cómo está.
function pairingChanged(live: Live): void {
  // En el momento, antes de que la respuesta que lo trajo llegue a quien la pidió.
  live.confirm.stale();
  live.enqueue(() => {
    const now = live.state();
    if (now.kind !== 'waiting' || live.topic) return live.check();
    if (now.why !== 'version' || !live.deps.outdated())
      subscribe(live, now.pairing.side === 'phone');
  });
}

export function createRuntime(deps: Deps) {
  const state = createStore<PairingState>({ kind: 'asleep' });
  const live = createLive(deps, state);
  // Hay internet según el último pedido al servidor, no según el navegador (§ 8.5).
  const stopOnline = deps.online.subscribe((online) =>
    live.dispatch({ type: online ? 'internetBack' : 'internetLost' }),
  );
  return {
    state,
    dispatch: live.dispatch,
    check: live.check,
    pairingChanged: () => pairingChanged(live),
    // Para mostrar cuánto tarda la ruta por el directo (solo con el detalle abierto).
    roundTripMs: () => live.current?.direct?.roundTripMs() ?? Promise.resolve(undefined),
    // Esperar a que termine lo que está en la fila (para las pruebas).
    settled: () => new Promise<void>((resolve) => live.enqueue(resolve)),
    // Soltar todo sin avisar a la máquina: la pestaña se cierra.
    stop() {
      stopOnline();
      unsubscribe(live);
      closeTransport(live, false);
      detachMirror(live, false);
    },
  };
}

export type Runtime = ReturnType<typeof createRuntime>;
