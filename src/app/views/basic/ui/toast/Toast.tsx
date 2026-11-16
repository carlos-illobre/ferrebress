// La tostada de «Mostrador»: dibuja el aviso al pie que pidió la lógica (platform/view/notify.ts).
import { useNotice } from '../../../../platform/view/notify.ts';
import { Icon } from '../icon/Icon.tsx';
import { Say } from '../say/Say.tsx';
import './toast.css';

export function Toasts() {
  const { notice, act } = useNotice();
  if (!notice) return null;
  return (
    // Puede decir un nombre o un correo: no va en la captura de «Algo salió mal».
    <div class="toast" role="status" data-private="">
      <Icon name={notice.icon} />
      <span>
        <Say words={notice.words} />
      </span>
      {notice.action && (
        <button type="button" class="toast-action" onClick={act}>
          {notice.action.label}
        </button>
      )}
    </div>
  );
}
