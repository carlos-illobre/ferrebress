// La tostada de «Mostrador»: un aviso corto que se va solo a los 2,4 segundos (lo que todavía no
// está, «Aviso guardado», la versión nueva). Una sola a la vez, para toda la aplicación.
import { createStore, useStore } from '../../platform/store.ts';
import { Icon, type IconName } from '../icon/Icon.tsx';
import { Say, type Words } from '../say/Say.tsx';
import './toast.css';

export const toastMs = 2400;

type Shown = { words: Words; icon: IconName };

const current = createStore<Shown | undefined>(undefined);
let timer: ReturnType<typeof setTimeout> | undefined;

export function showToast(words: Words | string, icon: IconName = 'clock'): void {
  clearTimeout(timer);
  current.set({ words: typeof words === 'string' ? { long: words, short: words } : words, icon });
  timer = setTimeout(() => current.set(undefined), toastMs);
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
    </div>
  );
}
