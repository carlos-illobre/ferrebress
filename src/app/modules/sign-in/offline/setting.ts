// La opción «Trabajar sin conexión» de Más (15 · R1): se ve solo en el celular, si la persona trae
// `offline` del servidor (tiene el permiso y su propia huella en este celular). Prenderla necesita
// conexión; apagarla, no. El marco la muestra sin saber de estas reglas.
import type { Person } from '@ferrebress/shared/contracts/sign-in';
import { isPhone } from '../../../platform/device/device.ts';
import { lastReply, online as onlineStore } from '../../../platform/server/api.ts';
import { useStore } from '../../../platform/store.ts';
import { showToast } from '../../../ui/toast/Toast.tsx';
import type { SettingRow } from '../../frame/index.ts';
import { texts } from '../texts.ts';
import { contacted, disableOffline, enableOffline, permit } from './permit.ts';

export function useOfflineSetting(who: Person | undefined): SettingRow | undefined {
  const current = useStore(permit);
  const online = useStore(onlineStore);
  if (!who?.offline || !isPhone()) return undefined;
  const on = current?.person.userId === who.userId;
  return {
    name: texts.offlineSetting.name,
    detail: texts.offlineSetting.detail,
    on,
    toggle() {
      if (on) return disableOffline();
      if (!online) return showToast(texts.offlineSetting.needsInternet);
      // El último pedido que el servidor aceptó con esta sesión es el último contacto.
      contacted(lastReply.get() ?? Date.now());
      enableOffline(who);
    },
  };
}
