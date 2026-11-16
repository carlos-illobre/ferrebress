// El modelo de Más → Configuración (ADR-019): las preferencias de este dispositivo, lo mío, el nombre
// del dispositivo y vincular la huella. La pantalla se anuncia para las capas (los atajos).
import { useState } from 'preact/hooks';
import { useScreen } from '../../platform/screens.ts';
import { useMine } from './mine/useMine.ts';
import { useName } from './mine/useName.ts';
import { installHere, useSettings } from './useSettings.ts';

// Vincular la huella de este celular: primero se vuelve a confirmar quién es (02 · R3.8).
function useLinking(link: () => Promise<void>) {
  const [confirming, setConfirming] = useState(false); // local: la huella es de este celular
  return {
    confirming,
    ask: () => setConfirming(true),
    close: () => setConfirming(false),
    confirmed: link,
  };
}

// «Cerrar todas» las otras sesiones: primero se pregunta (04 · R7). Desde este dispositivo, no se
// espeja.
function useClosingAll(closeAll: () => Promise<unknown>) {
  const [asking, setAsking] = useState(false); // local: lo pregunta este dispositivo
  return {
    asking,
    ask: () => setAsking(true),
    cancel: () => setAsking(false),
    confirm: async () => {
      setAsking(false);
      await closeAll();
    },
  };
}

export function useDeviceSettings() {
  const settings = useSettings();
  const mine = useMine();
  const here = 'data' in mine.state ? mine.state.data?.here : undefined;
  const model = {
    settings,
    mine,
    here,
    name: useName(mine, here),
    linking: useLinking(mine.link),
    closingAll: useClosingAll(mine.closeAll),
    install: installHere,
  };
  useScreen('device-settings', model);
  return model;
}

export type DeviceSettings = ReturnType<typeof useDeviceSettings>;
