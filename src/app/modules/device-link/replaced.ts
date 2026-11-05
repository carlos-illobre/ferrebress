// Entrar a otra computadora con el celular reemplaza el vínculo sin preguntar (R1.5): el celular lo
// avisa una vez, «Ahora este celular está vinculado a Chrome en Windows», con «Desvincular» por si no
// era lo que quería. Lo ve en su estado: el vínculo cambió por otro sin que lo leyera él.
import { showToast } from '../../ui/toast/Toast.tsx';
import { reading, unpairAsked } from './detail.ts';
import type { PairingState } from './machine/types.ts';
import type { Runtime } from './runtime.ts';
import { texts } from './texts.ts';

const idOf = (state: PairingState) => ('pairing' in state ? state.pairing.id : undefined);

export function watchReplaced(runtime: Runtime): () => void {
  let before = idOf(runtime.state.get());
  return runtime.state.subscribe((state) => {
    const now = idOf(state);
    const replaced = before !== undefined && now !== undefined && now !== before;
    before = now ?? before;
    if (!replaced || !('pairing' in state) || state.pairing.side !== 'phone' || reading.get())
      return;
    showToast(texts.replaced(state.pairing.other.label), 'check', {
      label: texts.unpair,
      run: () => unpairAsked.set(true),
    });
  });
}
