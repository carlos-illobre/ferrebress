// Los avisos al pie (la tostada de «Mostrador»): un aviso corto que se va solo (lo que todavía no
// está, «Aviso guardado», la versión nueva). Uno solo a la vez, para toda la aplicación. Puede traer
// un botón (el de «Desvincular» del vínculo, 03 · R1.5): entonces dura más, para alcanzar a tocarlo.
// Quien pide otro tiempo lo dice en `ms` (el «Deshacer» de Administración, 5 segundos, 06 · R2.1).
// La lógica los pide con notify; cada vista los dibuja con lo que lee de useNotice (ADR-019).
import { createStore, useStore } from '../store.ts';
import type { IconName } from './icon-name.ts';
import { viewSettings } from './settings.ts';
import type { Words } from './words.ts';

export type NoticeAction = { label: string; run: () => void; ms?: number };
export type Notice = { words: Words; icon: IconName; action?: NoticeAction | undefined };

const current = createStore<Notice | undefined>(undefined);
let timer: ReturnType<typeof setTimeout> | undefined;

export function notify(
  words: Words | string,
  icon: IconName = 'clock',
  action?: NoticeAction,
): void {
  clearTimeout(timer);
  const said = typeof words === 'string' ? { long: words, short: words } : words;
  current.set({ words: said, icon, action });
  timer = setTimeout(
    () => current.set(undefined),
    action ? (action.ms ?? viewSettings.notice.withActionMs) : viewSettings.notice.ms,
  );
}

// El aviso que se ve ahora, si hay, y su botón: tocarlo cierra el aviso y hace lo suyo.
export function useNotice(): { notice: Notice | undefined; act: () => void } {
  const notice = useStore(current);
  return {
    notice,
    act() {
      current.set(undefined);
      notice?.action?.run();
    },
  };
}
