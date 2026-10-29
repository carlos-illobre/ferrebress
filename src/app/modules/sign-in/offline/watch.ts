// Lo que el celular aprende del servidor para entrar sin conexión (15 · R1.5, R2.2; diseño de 15,
// § 5): cada pedido con sesión que el servidor acepta es un contacto; la sesión cerrada desde otro
// dispositivo no deja entrar sin conexión hasta el próximo contacto; la baja, o que la persona ya
// no pueda (perdió el permiso o su huella), apaga la opción. Y una sesión abierta sin conexión se
// corta a las 24 horas del último contacto (R2.7).
import { lastReply, sessionClosed } from '../../../platform/server/api.ts';
import { offlineSession, person } from '../session.ts';
import { contacted, disableOffline, offlineSessionOver, permit, revokeOffline } from './permit.ts';

const minute = 60_000;

function checkPerson(): void {
  const who = person.get();
  const current = permit.get();
  const own = who && current && who.userId === current.person.userId;
  if (own && !who.offline && !offlineSession()) disableOffline();
}

// Si la sesión de ahora se abrió sin conexión y ya pasó el plazo, aparece la entrada encima.
function checkDeadline(): void {
  if (offlineSession() && person.get() && !sessionClosed.get() && offlineSessionOver()) {
    sessionClosed.set('max-age');
  }
}

export function watchOffline(): () => void {
  checkPerson();
  checkDeadline();
  const timer = setInterval(checkDeadline, minute);
  document.addEventListener('visibilitychange', checkDeadline);
  const stops = [
    lastReply.subscribe((at) => {
      if (at && person.get() && !sessionClosed.get() && !offlineSession()) contacted(at);
    }),
    sessionClosed.subscribe((reason) => {
      if (reason === 'revoked') revokeOffline();
      if (reason === 'deactivated' || reason === 'not-authorized') disableOffline();
    }),
    person.subscribe(checkPerson),
  ];
  return () => {
    clearInterval(timer);
    document.removeEventListener('visibilitychange', checkDeadline);
    for (const stop of stops) stop();
  };
}
