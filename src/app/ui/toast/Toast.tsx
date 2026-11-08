// La tostada de «Mostrador»: un aviso corto que se va solo a los 2,4 segundos (lo que todavía no
// está, «Aviso guardado», la versión nueva). Una sola a la vez, para toda la aplicación. Puede traer
// un botón (el de «Desvincular» del vínculo, 03 · R1.5): entonces dura 6 segundos, para alcanzar a
// tocarlo, y es lo único de la tostada que recibe toques. Quien pide otro tiempo lo dice en `ms` (el
// «Deshacer» de Administración, 5 segundos, 06 · R2.1).
import { createStore, useStore } from '../../platform/store.ts';
import { Icon, type IconName } from '../icon/Icon.tsx';
import { Say, type Words } from '../say/Say.tsx';
import './toast.css';
import { uiSettings } from '../settings.ts';

type Action = { label: string; run: () => void; ms?: number };
type Shown = { words: Words; icon: IconName; action?: Action | undefined };

const current = createStore<Shown | undefined>(undefined);
let timer: ReturnType<typeof setTimeout> | undefined;

export function showToast(words: Words | string, icon: IconName = 'clock', action?: Action): void {
  clearTimeout(timer);
  const said = typeof words === 'string' ? { long: words, short: words } : words;
  current.set({ words: said, icon, action });
  timer = setTimeout(
    () => current.set(undefined),
    action ? (action.ms ?? uiSettings.toast.withActionMs) : uiSettings.toast.ms,
  );
}

export function Toasts() {
  const shown = useStore(current);
  if (!shown) return null;
  return (
    // Puede decir un nombre o un correo: no va en la captura de «Algo salió mal».
    <div class="toast" role="status" data-private="">
      <Icon name={shown.icon} />
      <span>
        <Say words={shown.words} />
      </span>
      {shown.action && (
        <button
          type="button"
          class="toast-action"
          onClick={() => {
            current.set(undefined);
            shown.action?.run();
          }}
        >
          {shown.action.label}
        </button>
      )}
    </div>
  );
}
