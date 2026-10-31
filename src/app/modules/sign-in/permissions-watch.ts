// Saber que cambiaron los permisos sin pedidos de más (02 · R7.8; diseño de 02, § 20): cada respuesta
// trae en la cabecera la huella de los permisos de la sesión; si no es la de la persona que tiene la
// aplicación, vuelve a pedir /api/start, una vez por huella nueva, y la persona queda al día. El marco
// arma el menú de nuevo y, si la pantalla abierta ya no se puede usar, lo dice.
import { permissionsHash as hashOf } from '@ferrebress/shared/contracts/can';
import { permissionsHash } from '../../platform/server/api.ts';
import { signInApi } from './api.ts';
import { confirmed, person } from './session.ts';

export function watchPermissions(): () => void {
  let asked: string | undefined;
  return permissionsHash.subscribe(async (hash) => {
    const who = person.get();
    if (!hash || !who || hash === hashOf(who.permissions) || hash === asked) return;
    asked = hash;
    const start = await signInApi.start();
    const now = start.ok ? start.data.person : undefined;
    if (now && now.userId === person.get()?.userId) confirmed(now);
  });
}
