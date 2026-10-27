// La espera de más de 2 segundos (00 · R7.3), desde su maqueta: una línea arriba del área de
// trabajo y una tarjeta chica abajo que dice qué se está haciendo. Hoy nunca se sabe cuánto falta,
// así que la barra va y viene. Al terminar dice «Listo» un instante y se va.
import { useEffect, useState } from 'preact/hooks';
import { useStore } from '../../../platform/store.ts';
import { waitBar } from '../../../platform/waiting.ts';
import { Icon } from '../../../ui/icon/Icon.tsx';
import { Say } from '../../../ui/say/Say.tsx';
import { texts } from '../texts.ts';

export const doneMs = 900;

export function WaitNotice() {
  const doing = useStore(waitBar);
  const [shown, setShown] = useState<{ doing: string; done: boolean }>();

  useEffect(() => {
    if (doing) return setShown({ doing, done: false });
    if (!shown) return;
    setShown({ ...shown, done: true });
    const timer = setTimeout(() => setShown(undefined), doneMs);
    return () => clearTimeout(timer);
  }, [doing]);

  if (!shown) return null;
  const done = shown.done;
  return (
    <>
      <div class={done ? 'wait-line done' : 'wait-line'} aria-hidden="true">
        <span class="wait-line-progress" />
      </div>
      <div class={done ? 'wait-notice done' : 'wait-notice'} role="status">
        <span class="wait-icon">
          <Icon name={done ? 'check' : 'refresh-cw'} />
        </span>
        <span class="wait-what">
          <span>{done ? texts.wait.done : shown.doing}</span>
          {!done && (
            <span class="wait-left">
              <Say words={texts.wait.unknown} />
            </span>
          )}
        </span>
        <span class="wait-bar">
          <b class="wait-bar-progress" />
        </span>
      </div>
    </>
  );
}
