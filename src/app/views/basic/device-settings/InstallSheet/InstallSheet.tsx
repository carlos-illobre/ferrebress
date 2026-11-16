// El aviso para instalar, en el celular (04 · R4.5; maqueta device-settings-install/final): una
// hoja con el inicio en chico y el ícono ya puesto. Mientras el navegador pregunta, queda trabada.
// Cerrada sin instalar, de cualquier forma, recuerda dónde está instalar. Es del celular: no se
// espeja.
import { texts, useInstallSheet } from '../../../../modules/device-settings/model.ts';
import { useBackStep } from '../../../../platform/view/back-step.ts';
import { Button } from '../../ui/button/Button.tsx';
import { Icon } from '../../ui/icon/Icon.tsx';
import { Sheet } from '../../ui/sheet/Sheet.tsx';
import './InstallSheet.css';

const t = texts.offer;

export function InstallSheet({ onClose }: { onClose: () => void }) {
  const sheet = useInstallSheet(onClose);
  useBackStep(sheet.back);
  return (
    <Sheet title={t.title} onClose={sheet.dismiss} locked={sheet.asking} className="install-sheet">
      <div class="install-home" aria-hidden="true">
        <span class="install-app" />
        <span class="install-app" />
        <span class="install-app mine">
          <img src="/icons/icon-192.png" alt="" width="48" height="48" />
          <small>Ferrebress</small>
        </span>
        <span class="install-app" />
      </div>
      <h2 class="install-title">{t.title}</h2>
      <p class="install-chips">
        <span class="settings-chip">
          <Icon name="zap" size="small" />
          {t.quick}
        </span>
        <span class="settings-chip">
          <Icon name="monitor" size="small" />
          {t.full}
        </span>
      </p>
      <Button look="action" size="large" icon="download" doing={t.install} onPress={sheet.install}>
        {t.install}
      </Button>
      <Button look="plain" doing={t.notNow} onPress={sheet.dismiss} closes disabled={sheet.asking}>
        {t.notNow}
      </Button>
    </Sheet>
  );
}
