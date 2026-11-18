// La espera de más de 1 segundo en el marco (00 · R7.3), sin HTML: qué se está haciendo y, al
// terminar, «Listo» un instante. La espera que ya corría cuando apareció el marco (la de entrar, con la
// huella o Google) no se muestra: al entrar no hay ningún «Listo».
import { useEffect, useRef, useState } from 'preact/hooks';
import { useStore } from '../../platform/store.ts';
import { waitBar } from '../../platform/waiting.ts';
import { frameSettings } from './settings.ts';

// Lo que dice la barra, sin la espera que ya corría cuando apareció el marco: ni mientras sigue ni
// cuando termina.
function useFrameWait(): string | undefined {
  const doing = useStore(waitBar);
  const before = useRef(doing);
  if (doing !== before.current) before.current = undefined;
  return doing === before.current ? undefined : doing;
}

export function useWaitNotice() {
  const doing = useFrameWait();
  // local: la espera de lo que hace este dispositivo.
  const [shown, setShown] = useState<{ doing: string; done: boolean }>();
  useEffect(() => {
    if (doing) return setShown({ doing, done: false });
    if (!shown) return;
    setShown({ ...shown, done: true });
    const timer = setTimeout(() => setShown(undefined), frameSettings.doneMs);
    return () => clearTimeout(timer);
  }, [doing]);
  return shown;
}
