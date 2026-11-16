// Más → Configuración (capítulo 04; maquetas device-settings-a/final y device-settings-b/final): arriba
// «Así la tenés» y «Volver a como viene»; este dispositivo, con su nombre, su huella y sus
// preferencias (las animaciones, el formato de la hora, instalar y, en el celular, trabajar sin
// conexión); y los otros dispositivos propios. Una sola pantalla para los dos anchos (ADR-002). Va en
// el arranque, así las preferencias abren sin conexión (diseño de 04, § 3).

import {
  type SettingsView,
  texts,
  useDeviceSettings,
} from '../../../../modules/device-settings/model.ts';
import { useShortcutHints } from '../../../../platform/view/shortcut-hints.ts';
import { deviceSettingsShapes } from '../../../../ui/icon/device-settings-shapes.tsx';
import { addShapes, Icon } from '../../../../ui/icon/Icon.tsx';
import { Say } from '../../../../ui/say/Say.tsx';
import { PhoneLight } from '../../frame/index.ts';
import { HereCard } from './Devices/Here.tsx';
import { Others } from './Devices/Others.tsx';
import './Devices/Devices.css';
import './Devices/Drawing.css';
import './Devices/Family.css';
import './Devices/Others.css';
import { InstallRow, OfflineRow } from './Install.tsx';
import { AnimationsRow, TimeRow } from './Rows.tsx';
import { Summary } from './Summary.tsx';
import './Settings.css';

addShapes(deviceSettingsShapes);

function Head({ view }: { view: SettingsView }) {
  const keys = useShortcutHints('device-settings');
  return (
    <header class="settings-head">
      <div class="settings-heading">
        <h1 class="settings-title">{texts.title}</h1>
        {view.changed && (
          <button type="button" class="settings-reset" data-mark="" onClick={view.reset}>
            <Icon name="rotate-ccw" size="small" />
            <Say words={texts.reset} />
            {keys.reset && <kbd>{keys.reset}</kbd>}
          </button>
        )}
      </div>
      <PhoneLight />
      <Summary view={view} />
    </header>
  );
}

export function Settings() {
  const model = useDeviceSettings();
  const { settings: view, mine } = model;
  return (
    <div class="settings">
      <Head view={view} />
      <section class="settings-body" aria-label={texts.title}>
        <HereCard model={model}>
          <div class="settings-card">
            <AnimationsRow view={view} />
            <TimeRow view={view} />
            <InstallRow view={view} />
            <OfflineRow view={view} />
          </div>
        </HereCard>
        <Others model={model} />
      </section>
    </div>
  );
}
