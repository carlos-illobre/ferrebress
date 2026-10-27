// La luz de conexión (00 · R4.1) y lo que está por enviar (R4.2). La luz no consulta nada: dice lo
// que contestó el servidor la última vez y lo que avisa el navegador (R4.3). Hoy no hay nada que
// se haga sin conexión, así que la lista está siempre vacía; se llena con el módulo 15.
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { Say } from '../../../../ui/say/Say.tsx';
import { useFrame } from '../../context.ts';
import { texts } from '../../texts.ts';
import './Pending.css';

export function LightText() {
  const { online } = useFrame();
  return (
    <>
      <span class="light-dot" />
      <span class="light-text">
        <Say words={online ? texts.light.online : texts.light.offline} />
      </span>
    </>
  );
}

export function Pending() {
  const { online } = useFrame();
  const p = texts.pending;
  return (
    <div class="pending-head">
      <span class="pending-icon">
        <Icon name={online ? 'check' : 'wifi-off'} />
      </span>
      <div>
        <b>{online ? p.onlineHead : p.offlineHead}</b>
        <small>
          <Say words={online ? p.onlineDetail : p.offlineDetail} />
        </small>
      </div>
    </div>
  );
}
