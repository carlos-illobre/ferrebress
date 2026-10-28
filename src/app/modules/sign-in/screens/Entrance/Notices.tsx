// Los avisos de la tarjeta: arriba, que la sesión se cerró (R3.4); en el medio, por qué no se pudo
// entrar: no autorizada (R1.3), sin conexión (R2.8) o demasiados intentos (R2.9).
import { Icon, type IconName } from '../../../../ui/icon/Icon.tsx';
import { minutes } from '../../notice.ts';
import { texts } from '../../texts.ts';
import { useEntrance } from './context.ts';

// La sesión vence sola por no usarla o por el tope (R3.1, R3.2); si no, alguien la cerró.
// Sin cookie (venció a las 8 horas y el navegador la borró) el servidor no sabe el motivo: venció.
const expiredReasons = new Set(['idle', 'max-age', 'unknown']);

export function ClosedNotice() {
  const { closed, signInFirst } = useEntrance();
  if (signInFirst)
    return (
      <div class="notice notice-top warn" role="alert">
        <Icon name="monitor" />
        <p>
          <strong>{texts.code.signInFirst}</strong>
        </p>
      </div>
    );
  if (!closed) return null;
  return (
    <div class="notice notice-top warn" role="alert">
      <Icon name="log-out" />
      <p>
        <strong>{expiredReasons.has(closed) ? texts.closedExpired : texts.closedElsewhere}</strong>
        <span>{texts.closedDetail}</span>
      </p>
    </div>
  );
}

function Shown({
  kind,
  icon,
  children,
}: {
  kind: string;
  icon: IconName;
  children: preact.ComponentChildren;
}) {
  return (
    <div class={`notice notice-main ${kind}`} role="alert">
      <Icon name={icon} />
      <p>{children}</p>
    </div>
  );
}

export function MainNotice() {
  const { online, notice } = useEntrance();
  if (!online)
    return (
      <Shown kind="warn" icon="wifi-off">
        <strong>{texts.needsInternet}</strong>
        {texts.needsInternetDetail}
      </Shown>
    );
  if (notice?.kind === 'not-authorized')
    return (
      <Shown kind="error" icon="ban">
        <span data-private="">{texts.notAuthorized(notice.email)}</span>
      </Shown>
    );
  if (notice?.kind === 'expired')
    return (
      <Shown kind="warn" icon="clock">
        {texts.expired}
      </Shown>
    );
  if (notice?.kind !== 'too-many') return null;
  return (
    <Shown kind="warn" icon="clock">
      <strong>{texts.tooMany}</strong>
      {texts.tryAgainIn} <b>{minutes(notice.seconds)}</b>.
    </Shown>
  );
}
