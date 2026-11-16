// Los avisos del marco, sin HTML: la versión nueva (00 · R5.3 a R5.5) y «Algo salió mal» (00 · R9).
import type { Person } from '@ferrebress/shared/contracts/sign-in';
import { route } from '../../platform/router.ts';
import { newVersion, online, updateRequired } from '../../platform/server/api.ts';
import { useStore } from '../../platform/store.ts';
import { notify } from '../../platform/view/notify.ts';
import { firstOption, optionAt } from './menu.ts';
import { crash } from './notices/crash/crash.ts';
import { dismissed, update } from './notices/update/update.ts';
import { texts } from './texts.ts';

// «Hay una versión nueva»: cerrada con «Ahora no», no vuelve hasta la próxima vez que se abra.
export function useVersionNotice() {
  const waiting = useStore(newVersion);
  const closed = useStore(dismissed);
  return {
    shown: !!waiting && !closed,
    update,
    later() {
      dismissed.set(true);
      notify(texts.update.later);
    },
  };
}

// «Hay que actualizar para seguir»: si el servidor ya no entiende esta versión.
export const useUpdateRequired = () => ({ required: !!useStore(updateRequired), update });

// «Algo salió mal»: el error que se vio, si hay, y cerrarlo.
export function useCrash() {
  return { shown: useStore(crash), close: () => crash.set(undefined) };
}

// Qué se ve en el marco: la conexión y la opción abierta, la de la dirección o, en cualquier otra,
// la primera que puede usar (R1.4).
export function useOpened(person: Person) {
  const opened = optionAt(useStore(route).path);
  return { online: useStore(online), opened, current: opened?.id ?? firstOption(person).id };
}
