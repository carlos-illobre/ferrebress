// Los avisos chicos del marco: en la computadora, el globo al costado del menú (el rótulo de un
// ícono o «todavía no está»); en el celular, la tostada que se va sola.
import { useRef, useState } from 'preact/hooks';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { useFrame } from '../../context.ts';
import { texts } from '../../texts.ts';
import { px } from '../../usePanels.ts';

export const toastMs = 2400;

export function Tips() {
  const { tip } = useFrame();
  const current = tip.tip;
  if (!current) return null;
  if (current.kind === 'label')
    return (
      <div
        class="tip label"
        aria-hidden="true"
        style={{ left: px(current.left), top: px(current.top) }}
      >
        <b>{current.name}</b>
        {current.detail && ` · ${current.detail}`}
      </div>
    );
  return (
    <div class="tip" role="status" style={{ left: px(current.left), top: px(current.top) }}>
      <Icon name="clock" />
      <span>{texts.notYet(current.name)}</span>
    </div>
  );
}

export function useToast() {
  const [text, setText] = useState<string>();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  return {
    text,
    show(next: string) {
      clearTimeout(timer.current);
      setText(next);
      timer.current = setTimeout(() => setText(undefined), toastMs);
    },
  };
}

export function Toast({ toast }: { toast: ReturnType<typeof useToast> }) {
  if (!toast.text) return null;
  return (
    <div class="toast" role="status">
      <Icon name="clock" />
      <span>{toast.text}</span>
    </div>
  );
}
