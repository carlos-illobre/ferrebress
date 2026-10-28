// «Hay una versión nueva» mientras se usa la aplicación (00 · R5.3, R5.4), desde su maqueta: una
// tarjeta en la esquina con «Ahora no» y «Actualizar». Cerrada, no vuelve hasta la próxima vez que
// se abra la aplicación, que se actualiza sola.
import { newVersion } from '../../../platform/server/api.ts';
import { useStore } from '../../../platform/store.ts';
import { Button } from '../../../ui/button/Button.tsx';
import { Icon } from '../../../ui/icon/Icon.tsx';
import { Say } from '../../../ui/say/Say.tsx';
import { showToast } from '../../../ui/toast/Toast.tsx';
import { texts } from '../texts.ts';
import { dismissed, update } from './update.ts';

export function VersionNotice() {
  const waiting = useStore(newVersion);
  const closed = useStore(dismissed);
  if (!waiting || closed) return null;
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
          shortcut="n"
          closes
          onPress={() => {
            dismissed.set(true);
            showToast(t.later);
          }}
        >
          {t.notNow}
        </Button>
        <Button doing={t.updating} look="dark" size="small" shortcut="a" onPress={update}>
          {t.now}
        </Button>
      </div>
    </section>
  );
}
