// Más → Configuración (capítulo 04; maqueta device-settings-a/final): arriba «Así la tenés» y
// «Volver a como viene»; en este dispositivo, las animaciones, el formato de la hora, instalar y,
// en el celular, trabajar sin conexión; y lo de la etapa b con «Pronto». Una sola pantalla para los
// dos anchos (ADR-002). Va en el arranque, así abre sin conexión (diseño de 04, § 3).

import { deviceSettingsShapes } from '../../../../ui/icon/device-settings-shapes.tsx';
import { addShapes, Icon } from '../../../../ui/icon/Icon.tsx';
import { Say } from '../../../../ui/say/Say.tsx';
import { showToast } from '../../../../ui/toast/Toast.tsx';
import { PhoneLight } from '../../../frame/index.ts';
import { texts } from '../../texts.ts';
import { type SettingsView, useSettings } from '../../useSettings.ts';
import { InstallRow, OfflineRow } from './Install.tsx';
import { AnimationsRow, TimeRow } from './Rows.tsx';
import { Summary } from './Summary.tsx';
import './Settings.css';

addShapes(deviceSettingsShapes);

function Head({ view }: { view: SettingsView }) {
  return (
    <header class="settings-head">
      <div class="settings-heading">
        <h1 class="settings-title">{texts.title}</h1>
        {view.changed && (
          <button
            type="button"
            class="settings-reset"
            data-key="o"
            data-mark=""
            onClick={view.reset}
          >
            <Icon name="rotate-ccw" size="small" />
            <Say words={texts.reset} />
            <kbd>O</kbd>
          </button>
        )}
      </div>
      <PhoneLight />
      <Summary view={view} />
    </header>
  );
}

// Lo de la etapa b (R1.8): tocarlo dice que todavía no está, como en Usuarios.
function Later() {
  return (
    <aside class="settings-later" aria-labelledby="settings-yours">
      <h2 class="settings-group" id="settings-yours">
        {texts.yours}
      </h2>
      <ul class="surface settings-card">
        {texts.later.map((item) => (
          <li key={item.name}>
            <button
              type="button"
              class="settings-row settings-soon"
              data-mark=""
              onClick={() => showToast(texts.notYet(item.name))}
            >
              <span class="settings-icon neutral">
                <Icon name={item.icon} />
              </span>
              <span class="settings-text">
                <b>{item.name}</b>
                <small class="desktop-only">{item.what}</small>
              </span>
              <span class="coming-soon">{texts.soon}</span>
            </button>
          </li>
        ))}
      </ul>
      <p class="settings-kept desktop-only">
        <Icon name="circle-info" />
        <span>{texts.kept}</span>
      </p>
    </aside>
  );
}

export function Settings() {
  const view = useSettings();
  return (
    <div class="settings">
      <Head view={view} />
      <section class="settings-body" aria-label={texts.title}>
        <div>
          <h2 class="settings-group desktop-only">{texts.here}</h2>
          <div class="surface settings-card">
            <AnimationsRow view={view} />
            <TimeRow view={view} />
            <InstallRow view={view} />
            <OfflineRow view={view} />
          </div>
        </div>
        <Later />
      </section>
    </div>
  );
}
