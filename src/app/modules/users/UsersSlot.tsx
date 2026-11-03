// El lugar de Usuarios en el marco: baja el código de la pantalla recién al abrirla, así no pesa en
// el arranque (diseño de 01, § 10). Si no se puede bajar habiendo red, es una versión vieja después
// de un despliegue: se pide actualizar; sin red, lo dice (Usuarios necesita conexión, R2.2).
import { useLazy } from '../../platform/lazy.ts';
import './UsersSlot.css';

// Su texto vive acá y no en texts.ts: este archivo va en el arranque y texts.ts no.
const offline = 'Sin conexión: Usuarios vuelve sola cuando vuelva la conexión.';

export function UsersSlot() {
  const screen = useLazy(() => import('./screens/Users/Users.tsx'));
  if (screen === 'offline')
    return (
      <p class="users-unloaded" role="status">
        {offline}
      </p>
    );
  return screen ? <screen.Users /> : null;
}
