// «Actualizar solo» (R4.6, R4.12; maqueta final de users-who-did-what): el selector con el ícono de
// actualizar y la llave, en el lugar de «Actualizar», con lo que gasta esta pantalla debajo; y «3
// nuevas» arriba de la lista, que lleva a la página 1 con lo nuevo marcado.

import { texts, useAuditLogContext } from '../../../modules/audit-log/model.ts';
import { kbPerMinute } from '../../../platform/view/meter.ts';
import { useShortcutHints } from '../../../platform/view/shortcut-hints.ts';
import { Icon } from '../../../ui/icon/Icon.tsx';
import '../../../ui/switch/switch.css';
import './Live.css';

export function LiveSwitch() {
  const { live, online } = useAuditLogContext();
  const keys = useShortcutHints('audit-log');
  if (!live.shown) return null;
  return (
    <div class="audit-live">
      <button
        type="button"
        class="audit-live-switch"
        role="switch"
        aria-checked={live.on}
        aria-label={texts.live}
        aria-describedby="audit-live-rate"
        title={texts.live}
        data-mark=""
        disabled={!online}
        onClick={live.toggle}
      >
        <Icon name="refresh-cw" />
        <span class="switch" aria-hidden="true" />
        {keys.live && <kbd>{keys.live}</kbd>}
      </button>
      <p class="audit-live-rate" id="audit-live-rate" title={texts.liveRate}>
        {kbPerMinute(live.rate)}
      </p>
    </div>
  );
}

export function NewOnes() {
  const { live, newOnes, showNew } = useAuditLogContext();
  const keys = useShortcutHints('audit-log');
  if (!live.on || !live.shown || newOnes === 0) return null;
  return (
    <div class="audit-new">
      <button
        type="button"
        class="audit-new-button"
        title={texts.newOnesHint}
        data-mark=""
        onClick={showNew}
      >
        <Icon name="arrow-up" size="small" />
        <span>{texts.newOnes(newOnes)}</span>
        {keys.newOnes && <kbd>{keys.newOnes}</kbd>}
      </button>
    </div>
  );
}
