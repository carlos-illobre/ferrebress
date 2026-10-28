// «Hay que actualizar para seguir» (00 · R5.5): si el servidor ya no entiende esta versión, la
// aplicación se bloquea con un solo botón. No se cierra: no tiene nada para Esc, y tocar afuera lo
// sacude.
import { updateRequired } from '../../../platform/server/api.ts';
import { useStore } from '../../../platform/store.ts';
import { Button } from '../../../ui/button/Button.tsx';
import { Dialog } from '../../../ui/dialog/Dialog.tsx';
import { Icon } from '../../../ui/icon/Icon.tsx';
import { Say } from '../../../ui/say/Say.tsx';
import { texts } from '../texts.ts';
import { update } from './update.ts';

export function UpdateBlock() {
  const required = useStore(updateRequired);
  if (!required) return null;
  const t = texts.update;
  return (
    <Dialog label={t.requiredTitle} className="update-block">
      <div class="update-block-icon">
        <Icon name="refresh-cw" size="huge" />
      </div>
      <h2 class="title">{t.requiredTitle}</h2>
      <p class="body update-block-detail">
        <Say words={t.requiredDetail} />
      </p>
      <Button
        doing={t.updating}
        look="action"
        size="large"
        icon="refresh-cw"
        shortcut="a"
        primary
        onPress={update}
      >
        {t.now}
      </Button>
    </Dialog>
  );
}
