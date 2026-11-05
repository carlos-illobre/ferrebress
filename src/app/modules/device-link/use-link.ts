// Lo que muestran las pantallas del vínculo: el estado de ahora, ya como lo ve la persona (`view.ts`).
// El vínculo se baja después del arranque: hasta que llega, no hay nada que mostrar.

import type { PairingView } from '@ferrebress/shared/contracts/pairing';
import { useEffect, useState } from 'preact/hooks';
import { startParts } from '../../platform/server/start-parts.ts';
import { useStore } from '../../platform/store.ts';
import { linkRuntime } from './current.ts';
import type { PairingState } from './machine/types.ts';
import { type LinkView, viewOf } from './view.ts';

const asleep: PairingState = { kind: 'asleep' };

// Mientras el vínculo se baja, lo que dijo `/api/start` (sin validar: solo se muestra; el vínculo
// valida al llegar): así el indicador no aparece de golpe un momento después.
function fromStart(parts: Record<string, unknown> | undefined): PairingState {
  if (!parts) return asleep;
  const pairing = parts.pairing as PairingView | null | undefined;
  if (!pairing) return { kind: 'unpaired' };
  return pairing.paused ? { kind: 'paused', pairing } : { kind: 'waiting', pairing };
}

export function useLinkView(): LinkView {
  const runtime = useStore(linkRuntime);
  const parts = useStore(startParts);
  // local: el estado del vínculo de este dispositivo.
  const [state, setState] = useState<PairingState>(runtime?.state.get() ?? asleep);
  useEffect(() => {
    if (!runtime) return setState(fromStart(parts));
    setState(runtime.state.get());
    return runtime.state.subscribe(setState);
  }, [runtime, parts]);
  return viewOf(state);
}
