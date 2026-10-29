// El lugar del manual en la aplicación (diseño del manual, §§ 4 y 5): baja el código de la pantalla
// recién al abrirlo (vive en /manual/, fuera de lo que guarda el service worker). Si no se puede
// bajar habiendo red, es una versión vieja después de un despliegue: se pide actualizar (R5.5); sin
// red, lo dice. Este archivo va en el arranque: solo tiene eso.
import type { ComponentType } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { isPhone } from '../../platform/device/device.ts';
import { route } from '../../platform/router.ts';
import { updateRequired } from '../../platform/server/api.ts';
import { useStore } from '../../platform/store.ts';
import { backOf } from './back.ts';
import type { Back } from './screens/Manual/Manual.tsx';

type Screen = ComponentType<{ device: 'computer' | 'phone'; testing: boolean; back: Back }>;

const offline = 'El manual necesita internet.';

export function ManualSlot({ testing }: { testing: boolean }) {
  const [screen, setScreen] = useState<{ Manual: Screen } | 'offline'>();
  const where = useStore(route);
  useEffect(() => {
    import('./screens/Manual/Manual.tsx').then(
      (loaded) => setScreen({ Manual: loaded.Manual }),
      () => {
        if (navigator.onLine) updateRequired.set(true);
        else setScreen('offline');
      },
    );
  }, []);
  const back = backOf(where.state);
  if (screen === 'offline')
    return (
      <div class="manual-missing" role="status">
        {offline}{' '}
        <button type="button" onClick={() => back.go(0)}>
          {back.long}
        </button>
      </div>
    );
  if (!screen) return null;
  return <screen.Manual device={isPhone() ? 'phone' : 'computer'} testing={testing} back={back} />;
}
