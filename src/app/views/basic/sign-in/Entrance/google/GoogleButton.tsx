// «Continuar con Google» (R2.1, R7.1). El botón lo dibuja Google en su propio marco
// (google/messages.ts); mientras tanto, su lugar muestra «El hilo» (useGooglePhase.ts), del mismo
// tamaño, así que cuando aparece no se mueve nada. Si no carga, se puede reintentar.

import type { GooglePhase } from '../../../../../modules/sign-in/model.ts';
import {
  googleFramePath,
  limited,
  texts,
  useEntranceModelContext,
} from '../../../../../modules/sign-in/model.ts';
import { useShortcutHints } from '../../../../../platform/view/shortcut-hints.ts';
import { Icon } from '../../../ui/icon/Icon.tsx';
import { GoogleG } from './GoogleG.tsx';
import './google-slot.css';

const t = texts.googleSlot;

// Lo que se ve en el lugar mientras no está el botón: el hilo, «Reintentar» o que falta internet.
function Waiting({ phase, again }: { phase: GooglePhase; again: () => void }) {
  const keys = useShortcutHints('sign-in');
  return (
    <>
      <div class="g-thread" aria-hidden="true">
        <span class="g-label">
          <GoogleG />
          {t.connecting}
        </span>
        <span class="g-track">
          <span class="g-run" />
          <span class="g-fill" />
        </span>
      </div>
      {phase === 'failed' && (
        <button type="button" class="g-fail" data-mark="" onClick={again}>
          <span class="g-label">
            <Icon name="refresh-cw" size="small" />
            <span>{t.failed}</span>
            <b>{t.retry}</b>
            {keys.retryGoogle && <kbd>{keys.retryGoogle}</kbd>}
          </span>
          <span class="g-track" />
        </button>
      )}
      {phase === 'offline' && (
        <p class="g-off">
          <span class="g-label">
            <Icon name="wifi-off" size="small" />
            {t.offline}
          </span>
        </p>
      )}
    </>
  );
}

export function GoogleButton() {
  const { state: entrance, google } = useEntranceModelContext();
  // Apagado (sin conexión o con demasiados intentos) se ve gris el botón ya dibujado; tampoco se
  // llega con el teclado: inert saca el marco del orden de Tab.
  const off = limited(entrance) && google.phase === 'ready';
  return (
    <div
      class={`google${off ? ' off' : ''}${google.arrived ? ' arrived' : ''}`}
      data-phase={google.phase}
      data-drawn={google.drawn ? '' : undefined}
      inert={off}
    >
      <Waiting phase={google.phase} again={google.again} />
      <iframe key={google.frameKey} ref={google.frame} src={googleFramePath} title={texts.google} />
    </div>
  );
}
