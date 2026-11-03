// El aviso de una pantalla que necesita conexión y no la tiene: en ámbar, arriba de lo que queda
// en gris. La clase de cada pantalla le da su lugar.
import { Icon } from '../icon/Icon.tsx';
import './offline.css';

export function Offline({ look, text }: { look: string; text: string }) {
  return (
    <p class={`offline ${look}`} role="status">
      <Icon name="wifi-off" size="small" />
      {text}
    </p>
  );
}
