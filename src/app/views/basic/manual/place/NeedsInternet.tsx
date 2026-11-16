// «El manual necesita internet» (00 · R4.4, diseño del manual, § 5): la única pantalla para cuando el
// manual no llega, porque la red se cortó entre el toque y la carga (el código o el índice). Va en
// el arranque, así se ve aunque no haya llegado el código del manual.
import { Icon } from '../../../ui/icon/Icon.tsx';
import type { Back } from './back.ts';
import './NeedsInternet.css';

export const needsInternet = 'El manual necesita internet.';

export function NeedsInternet({ back }: { back: Back }) {
  return (
    <div class="manual-needs-internet" role="status">
      <Icon name="wifi-off" size="large" />
      <p>{needsInternet}</p>
      <button type="button" class="button" onClick={() => back.go(0)}>
        {back.long}
      </button>
    </div>
  );
}
