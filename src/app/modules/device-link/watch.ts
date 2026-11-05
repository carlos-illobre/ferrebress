// Lo que el vínculo escucha de la aplicación (diseño de 03, § 6 y § 11.1), sin que los otros módulos lo
// conozcan: quién tiene la sesión, la huella `l=` de cada respuesta, si la pestaña está a la vista y si
// es la que espeja (R6.4). Y lo que suma a los pedidos: `X-Pairing` en las escrituras mientras espeja
// (§ 7.2). Todo llega de afuera, para probarlo sin la aplicación entera.
import {
  isMirroredWrite,
  type PairingView,
  pairingHeaderName,
} from '@ferrebress/shared/contracts/pairing';
import type { Store } from '../../platform/store.ts';
import type { Runtime } from './runtime.ts';

// Un valor que se lee y avisa cuando cambia (un `Store` sin `set`).
export type Watched<T> = Pick<Store<T>, 'get' | 'subscribe'>;

type Options = {
  runtime: Runtime;
  // El `userId` de quien tiene la sesión, o nadie.
  who: Watched<string | undefined>;
  onField(letter: string, listener: (value: string | undefined) => void): () => void;
  decorate(
    decorator: (request: { path: string; write: boolean }) => Record<string, string>,
  ): () => void;
  // El vínculo que dijo `/api/start` al abrir: `undefined` mientras no contestó; `null`, ninguno.
  atStart: Watched<PairingView | null | undefined>;
  // Si esta pestaña es la que espeja; avisa cuando cambia.
  tabs(onChange: () => void): { mine(): boolean; stop(): void };
  visible(): boolean;
};

// Cómo se entera de su vínculo: la primera vez, por lo que dijo `/api/start` al abrir (sin un pedido
// más, § 10.1); después, preguntando.
function learner(runtime: Runtime, atStart: Options['atStart']) {
  let fromStart = true;
  return {
    learn(): void {
      if (!fromStart) return void runtime.check();
      const said = atStart.get();
      // Todavía no contestó: lo toma su aviso.
      if (said === undefined) return;
      fromStart = false;
      runtime.dispatch({ type: 'serverSaid', pairing: said });
    },
    pending: () => fromStart,
    // Otra persona entró después de abrir: lo de `/api/start` ya no es de ella.
    forget: () => {
      fromStart = false;
    },
  };
}

// Lo que el vínculo lee y suma en cada pedido: la huella `l=` y `X-Pairing` en las escrituras.
function onRequests(options: Options, isActive: () => boolean) {
  const { runtime, onField, decorate } = options;
  let seen = false;
  return [
    // La primera vez que se ve el campo no es un cambio: el vínculo de ahora lo dijo `/api/start` o lo
    // pregunta quien se presenta. Y solo la pestaña que espeja se entera: las otras, al tomar el candado.
    onField('l', () => {
      if (seen && isActive()) runtime.pairingChanged();
      seen = true;
    }),
    decorate(({ path, write }) => {
      const state = runtime.state.get();
      const mirroring = state.kind === 'direct' || state.kind === 'relayed';
      return write && mirroring && isMirroredWrite(path)
        ? { [pairingHeaderName]: state.pairing.id }
        : {};
    }),
  ];
}

export function watchLink(options: Options) {
  const { runtime, who, tabs, visible, atStart } = options;
  const known = learner(runtime, atStart);
  let active = false;
  const tab = tabs(() => sync());
  // A la vista y con el candado, esta pestaña se presenta (o vuelve); si no, suelta: se ocultó, u
  // otra pestaña tomó el espejo.
  function sync() {
    const now = visible() && tab.mine();
    if (now === active) return;
    active = now;
    if (who.get()) claim(now);
  }
  const claim = (now: boolean) => {
    if (!now) runtime.dispatch({ type: 'tabAway', why: visible() ? 'handover' : 'hidden' });
    else if (runtime.state.get().kind === 'away') runtime.dispatch({ type: 'tabBack' });
    else known.learn();
  };
  let person = who.get();
  const stops = [
    who.subscribe((next) => {
      if (next === person) return;
      if (person) runtime.sessionLost(next === undefined);
      person = next;
      known.forget();
      if (next && active) known.learn();
    }),
    atStart.subscribe(() => {
      if (known.pending() && who.get() && active) known.learn();
    }),
    ...onRequests(options, () => active),
  ];
  document.addEventListener('visibilitychange', sync);
  sync();
  return () => {
    for (const stop of stops) stop();
    document.removeEventListener('visibilitychange', sync);
    tab.stop();
  };
}
