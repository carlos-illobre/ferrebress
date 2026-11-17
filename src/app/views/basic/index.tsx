// La vista básica entera (ADR-019): arma la aplicación con lo que dice el shell (la entrada, el
// marco, el manual, la cámara), pone la pantalla de cada opción del menú y trae sus estilos.
import './styles/tokens.css';
import './styles/base.css';
import { useApp } from '../../shell/app.ts';
import { AdministrationSlot } from './administration/Slot.tsx';
import { AnomaliesSlot } from './anomalies/Slot.tsx';
import { CatalogSlot } from './catalog/Slot.tsx';
import { frameLink } from './device-link/frame-link.tsx';
import { InstallOffer } from './device-settings/InstallOffer.tsx';
import { Settings } from './device-settings/Settings/Settings.tsx';
import { Dialogs, Frame } from './frame/index.ts';
import { ManualSlot } from './manual/ManualSlot.tsx';
import { Camera, CodeSheet, Entrance, OfferSheet } from './sign-in/index.ts';
import { Toasts } from './ui/toast/Toast.tsx';
import { UsersSlot } from './users/index.ts';

// La pantalla de cada opción del menú que ya existe.
const screens = {
  users: UsersSlot,
  deviceSettings: Settings,
  administration: AdministrationSlot,
  anomalies: AnomaliesSlot,
  catalog: CatalogSlot,
};

export function BasicApp() {
  const app = useApp();
  const { start, who, testing, manual } = app;
  if (!start) return <Dialogs />;
  return (
    <>
      {who && (
        <div class="behind-manual" hidden={manual} inert={manual}>
          <Frame
            person={who}
            testing={testing}
            screens={screens}
            link={frameLink}
            onSignOut={app.leave}
          />
        </div>
      )}
      {app.entrance && (
        <Entrance
          start={start}
          onScan={app.openCamera}
          signInFirst={app.signInFirst}
          onStale={app.refresh}
        />
      )}
      {app.camera && <Camera onCode={app.scanned} onClose={app.closeCamera} />}
      {manual && <ManualSlot testing={testing} />}
      <CodeSheet code={app.code} />
      <OfferSheet />
      {who && !app.closed && <InstallOffer testing={testing} />}
      <Dialogs />
      <Toasts />
    </>
  );
}
