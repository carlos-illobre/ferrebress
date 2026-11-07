// El aviso para instalar, en el celular (04 · R4.5; maqueta device-settings-install/final): una
// hoja con el inicio en chico y el ícono ya puesto. Mientras el navegador pregunta, queda trabada.
// Cerrada sin instalar, de cualquier forma, recuerda dónde está instalar. Es del celular: no se
// espeja.
import { useRef, useState } from 'preact/hooks';
import { useBackStep } from '../../../../platform/back-step.ts';
import { Button } from '../../../../ui/button/Button.tsx';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { Sheet } from '../../../../ui/sheet/Sheet.tsx';
import { showToast } from '../../../../ui/toast/Toast.tsx';
import { texts } from '../../texts.ts';
import { installHere } from '../../useSettings.ts';
import './InstallSheet.css';

const t = texts.offer;

export function InstallSheet({ onClose }: { onClose: () => void }) {
  // Mientras el navegador pregunta, la hoja no se cierra (ni con «atrás»).
  // local: la pregunta del navegador está abierta en este celular.
  const [asking, setAsking] = useState(false);
  const askingNow = useRef(false);
  const dismiss = () => {
    onClose();
    showToast(t.later, 'settings');
  };
  useBackStep(() => {
    if (!askingNow.current) dismiss();
  });
  const installNow = async () => {
    askingNow.current = true;
    setAsking(true);
    const outcome = await installHere();
    askingNow.current = false;
    setAsking(false);
    if (outcome === 'accepted') onClose();
    else dismiss();
  };
  return (
    <Sheet title={t.title} onClose={dismiss} locked={asking} className="install-sheet">
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
      <Button look="action" size="large" icon="download" doing={t.install} onPress={installNow}>
        {t.install}
      </Button>
      <Button look="plain" doing={t.notNow} onPress={dismiss} closes disabled={asking}>
        {t.notNow}
      </Button>
    </Sheet>
  );
}
