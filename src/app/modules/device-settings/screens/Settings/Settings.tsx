// Más → Configuración (capítulo 04; maquetas device-settings-a/final y device-settings-b/final): arriba
// «Así la tenés» y «Volver a como viene»; este dispositivo, con su nombre, su huella y sus
// preferencias (las animaciones, el formato de la hora, instalar y, en el celular, trabajar sin
// conexión); y los otros dispositivos propios. Una sola pantalla para los dos anchos (ADR-002). Va en
// el arranque, así las preferencias abren sin conexión (diseño de 04, § 3).

import { deviceSettingsShapes } from '../../../../ui/icon/device-settings-shapes.tsx';
import { addShapes, Icon } from '../../../../ui/icon/Icon.tsx';
import { Say } from '../../../../ui/say/Say.tsx';
import { PhoneLight } from '../../../frame/index.ts';
import { useMine } from '../../mine/useMine.ts';
import { texts } from '../../texts.ts';
import { type SettingsView, useSettings } from '../../useSettings.ts';
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

export function Settings() {
  const view = useSettings();
  const mine = useMine();
  return (
    <div class="settings">
      <Head view={view} />
      <section class="settings-body" aria-label={texts.title}>
        <HereCard mine={mine}>
          <div class="settings-card">
            <AnimationsRow view={view} />
            <TimeRow view={view} />
            <InstallRow view={view} />
            <OfflineRow view={view} />
          </div>
        </HereCard>
        <Others mine={mine} />
      </section>
    </div>
  );
}
