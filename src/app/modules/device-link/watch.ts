// Lo que el vínculo escucha de la aplicación (diseño de 03, § 6 y § 11.1), sin que los otros módulos lo
// conozcan: quién tiene la sesión, la huella `l=` de cada respuesta, si la pestaña está a la vista y si
// es la que espeja (R6.4). Y lo que suma a los pedidos: `X-Pairing` en las escrituras mientras espeja
// (§ 7.2). Todo llega de afuera, para probarlo sin la aplicación entera.
import { pairingHeaderName } from '@ferrebress/shared/contracts/pairing';
import type { Store } from '../../platform/store.ts';
import type { Runtime } from './runtime.ts';

type Options = {
  runtime: Runtime;
  // El `userId` de quien tiene la sesión, o nadie.
  who: Store<string | undefined>;
  onField(letter: string, listener: (value: string | undefined) => void): () => void;
  decorate(decorator: (request: { write: boolean }) => Record<string, string>): () => void;
  // Si esta pestaña es la que espeja; avisa cuando cambia.
  tabs(onChange: () => void): { mine(): boolean; stop(): void };
  visible(): boolean;
};

// A la vista y con el candado, esta pestaña se presenta (o vuelve); si no, suelta: se ocultó, u otra
// pestaña tomó el espejo.
function claimed(runtime: Runtime, active: boolean, visible: boolean): void {
  if (!active) runtime.dispatch({ type: 'tabAway', why: visible ? 'handover' : 'hidden' });
  else if (runtime.state.get().kind === 'away') runtime.dispatch({ type: 'tabBack' });
  else void runtime.check();
}

export function watchLink({ runtime, who, onField, decorate, tabs, visible }: Options) {
  let active = false;
  const tab = tabs(() => sync());
  function sync() {
    const now = visible() && tab.mine();
    if (now === active) return;
    active = now;
    if (who.get()) claimed(runtime, now, visible());
  }
  let person = who.get();
  if (person && active) void runtime.check();
  const stops = [
    who.subscribe((next) => {
      if (person && next !== person)
        runtime.dispatch({ type: 'sessionLost', samePerson: next === undefined });
      person = next;
      if (next && active) void runtime.check();
    }),
    onField('l', () => runtime.pairingChanged()),
    decorate(({ write }) => {
      const state = runtime.state.get();
      const mirroring = state.kind === 'direct' || state.kind === 'relayed';
      return write && mirroring ? { [pairingHeaderName]: state.pairing.id } : {};
    }),
  ];
  document.addEventListener('visibilitychange', sync);
  sync();
  return () => {
    for (const stop of stops) stop();
    document.removeEventListener('visibilitychange', sync);
    tab.stop();
  };
}
