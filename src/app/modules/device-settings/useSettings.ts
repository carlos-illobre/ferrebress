// La lógica de Configuración, sin HTML: lo elegido por quien está adentro, lo que pide el sistema,
// qué renglón de instalar toca y «Trabajar sin conexión» de sign-in. Los valores son de este
// dispositivo y no van en valores con nombre: con el espejo, cada uno muestra y cambia lo suyo
// (04 · R1.6).
import { useEffect } from 'preact/hooks';
import { askInstalled, install, installState } from '../../platform/install.ts';
import { useSystemStill } from '../../platform/motion.ts';
import { useStore } from '../../platform/store.ts';
import { showToast } from '../../ui/toast/Toast.tsx';
import { person, useOfflineSetting } from '../sign-in/index.ts';
import { backToDefaults, choose, preferences } from './preferences.ts';
import { installRowOf, isDefault, type Preferences } from './rules.ts';
import { texts } from './texts.ts';

// Pide instalar (desde Configuración o desde el aviso); si queda, lo confirma con una vibración corta.
export async function installHere(): Promise<'accepted' | 'dismissed'> {
  const outcome = await install();
  if (outcome !== 'accepted') return outcome;
  showToast(texts.install.installedToast, 'check');
  navigator.vibrate?.([10, 40, 10]);
  return outcome;
}

export function useSettings() {
  const who = useStore(person);
  const chosen = useStore(preferences);
  const systemStill = useSystemStill();
  const install = installRowOf(useStore(installState));
  const offline = useOfflineSetting(who);
  useEffect(askInstalled, []);
  const userId = who?.userId ?? '';
  return {
    chosen,
    systemStill,
    install,
    offline,
    changed: !isDefault(chosen),
    set: (change: Partial<Preferences>) => choose(userId, change),
    reset() {
      backToDefaults(userId);
      showToast(texts.resetDone, 'rotate-ccw');
    },
  };
}

export type SettingsView = ReturnType<typeof useSettings>;
