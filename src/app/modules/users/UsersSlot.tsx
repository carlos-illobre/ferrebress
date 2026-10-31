// El lugar de Usuarios en el marco: baja el código de la pantalla recién al abrirla, así no pesa en
// el arranque (diseño de 01, § 10). Si no se puede bajar habiendo red, es una versión vieja después
// de un despliegue: se pide actualizar; sin red, lo dice (Usuarios necesita conexión, R2.2).
import type { ComponentType } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { updateRequired } from '../../platform/server/api.ts';
import './UsersSlot.css';

// Su texto vive acá y no en texts.ts: este archivo va en el arranque y texts.ts no.
const offline = 'Usuarios necesita conexión. Vuelve sola cuando haya.';

export function UsersSlot({ testing }: { testing: boolean }) {
  const [screen, setScreen] = useState<
    { Users: ComponentType<{ testing: boolean }> } | 'offline'
  >();
  useEffect(() => {
    import('./screens/Users/Users.tsx').then(
      (loaded) => setScreen({ Users: loaded.Users }),
      () => {
        if (navigator.onLine) updateRequired.set(true);
        else setScreen('offline');
      },
    );
  }, []);
  if (screen === 'offline')
    return (
      <p class="users-unloaded" role="status">
        {offline}
      </p>
    );
  return screen ? <screen.Users testing={testing} /> : null;
}
