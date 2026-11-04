// Lo que muestran las pantallas del vínculo: el estado de ahora, ya como lo ve la persona (`view.ts`).
// El vínculo se baja después del arranque: hasta que llega, no hay nada que mostrar.
import { useEffect, useState } from 'preact/hooks';
import { useStore } from '../../platform/store.ts';
import { linkRuntime } from './current.ts';
import type { PairingState } from './machine/types.ts';
import { type LinkView, viewOf } from './view.ts';

const asleep: PairingState = { kind: 'asleep' };

export function useLinkView(): LinkView {
  const runtime = useStore(linkRuntime);
  const [state, setState] = useState<PairingState>(runtime?.state.get() ?? asleep);
  useEffect(() => {
    if (!runtime) return setState(asleep);
    setState(runtime.state.get());
    return runtime.state.subscribe(setState);
  }, [runtime]);
  return viewOf(state);
}
