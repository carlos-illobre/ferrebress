// Con Bluetooth (R2.6): el navegador encuentra el celular cercano y muestra su propia ventana; la
// huella se pone en el celular. Reemplaza al QR propio.
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { texts } from '../../texts.ts';
import { withPasskey } from '../../useSignIn.ts';
import { limited, useEntrance } from './context.ts';

export function NearbyBlock() {
  const entrance = useEntrance();
  const off = limited(entrance);
  return (
    <div class="nearby-block desktop-only">
      <div class="nearby-art" aria-hidden="true">
        <span class="nearby-device">
          <Icon name="monitor" size="huge" />
        </span>
        <span class="nearby-waves">
          <i />
          <i />
          <i />
        </span>
        <span class="nearby-device">
          <Icon name="smartphone" size="huge" />
        </span>
      </div>
      <div class="nearby-text">
        <p>
          <b>{texts.nearby}</b>
          {texts.nearbyDetail}
        </p>
        <button
          type="button"
          class={off ? 'button-primary off' : 'button-primary'}
          disabled={off}
          data-mark=""
          data-key="c"
          onClick={() => entrance.attempt(withPasskey)}
        >
          <Icon name="bluetooth" size="large" />
          {texts.withPhone}
          <kbd>C</kbd>
        </button>
      </div>
    </div>
  );
}
