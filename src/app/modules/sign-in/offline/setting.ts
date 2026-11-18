// La opción «Trabajar sin conexión» (15 · R1, 04 · R5), que Configuración muestra: solo en el
// celular y para quien tiene el permiso. Se prende solo si el servidor dice que la huella de este
// celular es de esta persona (`offline`): la marca de huella guardada es del celular, no de la
// persona, y solo elige el texto de por qué no se puede. Prenderla necesita conexión; apagarla, no.
import { can } from '@ferrebress/shared/contracts/can';
import type { Person } from '@ferrebress/shared/contracts/sign-in';
import { isPhone } from '../../../platform/device/device.ts';
import { lastReply, online as onlineStore } from '../../../platform/server/api.ts';
import { useStore } from '../../../platform/store.ts';
import { notify } from '../../../platform/view/notify.ts';
import { hasPasskey } from '../session.ts';
import { texts } from '../texts.ts';
import {
  contacted,
  disableOffline,
  enableOffline,
  knownOfflineHours,
  offlineOption,
} from './option.ts';

// `blocked`: no se puede prender; `says` dice por qué (04 · R5.3).
// `says`: lo que dice debajo del nombre (por qué no se puede, o qué hace, prendida o apagada).
export type OfflineRow = {
  name: string;
  says: string;
  on: boolean;
  toggle: () => void;
  blocked?: true;
};

const t = texts.offlineSetting;

export function useOfflineSetting(who: Person | undefined): OfflineRow | undefined {
  const current = useStore(offlineOption);
  const online = useStore(onlineStore);
  if (!who || !isPhone() || !can(who, 'offline.work')) return undefined;
  const on = current?.person.userId === who.userId;
  const hours = knownOfflineHours();
  const says = on ? t.onDetail(hours) : t.detail(hours);
  // Sin `offline` del servidor no se prende; pero si es suya y está prendida (una sesión abierta sin
  // conexión, que no trae `offline`), la puede apagar igual (15 · R1.5).
  if (!who.offline && !on)
    return {
      name: t.name,
      says: hasPasskey() ? t.otherPasskey : t.needsPasskey,
      on: false,
      toggle: () => undefined,
      blocked: true,
    };
  return {
    name: t.name,
    says,
    on,
    toggle() {
      if (on) return disableOffline();
      if (!online) return notify(t.needsInternet, 'wifi-off');
      // El último pedido que el servidor aceptó con esta sesión es el último contacto.
      contacted(lastReply.get() ?? Date.now());
      enableOffline(who);
    },
  };
}
