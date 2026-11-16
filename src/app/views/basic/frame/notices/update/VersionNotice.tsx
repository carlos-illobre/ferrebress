// «Hay una versión nueva» mientras se usa la aplicación (00 · R5.3, R5.4), desde su maqueta: una
// tarjeta en la esquina con «Ahora no» y «Actualizar». Cerrada, no vuelve hasta la próxima vez que
// se abra la aplicación, que se actualiza sola.

import { texts, useVersionNotice } from '../../../../../modules/frame/model.ts';
import { useShortcutHints } from '../../../../../platform/view/shortcut-hints.ts';
import { Button } from '../../../ui/button/Button.tsx';
import { Icon } from '../../../ui/icon/Icon.tsx';
import { Say } from '../../../ui/say/Say.tsx';

export function VersionNotice() {
  const notice = useVersionNotice();
  const keys = useShortcutHints('version-notice');
  if (!notice.shown) return null;
  const t = texts.update;
  return (
    <section class="version-notice" role="status" aria-label={t.title} data-layer="">
      <span class="version-icon">
        <Icon name="sparkles" />
      </span>
      <div>
        <p class="version-title">{t.title}</p>
        <p class="version-detail">
          <Say words={t.detail} />
        </p>
      </div>
      <div class="version-actions">
        <Button
          doing={t.notNow}
          look="plain"
          size="small"
          keyHint={keys.later}
          closes
          onPress={notice.later}
        >
          {t.notNow}
        </Button>
        <Button
          doing={t.updating}
          look="dark"
          size="small"
          keyHint={keys.update}
          onPress={notice.update}
        >
          {t.now}
        </Button>
      </div>
    </section>
  );
}
