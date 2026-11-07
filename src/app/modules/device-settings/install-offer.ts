// El aviso para instalar (04 · R4.5 a R4.7): cuándo toca. Se ofrece una sola vez por celular, sea
// quien sea quien entre (instalar es del aparato): queda anotado apenas se muestra, así tampoco
// vuelve si se cierra la aplicación con el aviso abierto.
import { useEffect, useState } from 'preact/hooks';
import { isPhone } from '../../platform/device/device.ts';
import { readStored, store } from '../../platform/device/storage.ts';
import { installState } from '../../platform/install.ts';
import { useStore } from '../../platform/store.ts';
import { offerPasskey, person } from '../sign-in/index.ts';
import { shouldOffer } from './rules.ts';
import { deviceSettingsSettings } from './settings.ts';

const offeredKey = 'install-offered';

export function useInstallOffer(testing: boolean): { open: boolean; close: () => void } {
  // local: el aviso es del celular; con el espejo, la computadora no lo ve (diseño de 04, § 6).
  const [open, setOpen] = useState(false);
  const due = shouldOffer({
    phone: isPhone(),
    signedIn: useStore(person) !== undefined,
    testing,
    install: useStore(installState),
    offered: readStored<boolean>(offeredKey) === true,
    // Primero la huella, que es para entrar (R4.6).
    otherSheet: useStore(offerPasskey),
  });
  useEffect(() => {
    if (!due) return;
    const timer = setTimeout(() => {
      store(offeredKey, true);
      setOpen(true);
    }, deviceSettingsSettings.offerAfterMs);
    return () => clearTimeout(timer);
  }, [due]);
  return { open, close: () => setOpen(false) };
}
