// Las piezas de las hojas del celular, como en la maqueta de la entrada: el ícono redondo de arriba,
// el botón grande de la huella con su halo y los botones de abajo. Cada botón muestra su espera.
import type { ComponentChildren } from 'preact';
import { useWaiting } from '../../../../platform/waiting.ts';
import { Icon, type IconName } from '../../../../ui/icon/Icon.tsx';
import './sheets.css';

export const SheetIcon = ({ name, look }: { name: IconName; look?: 'computer' | 'done' }) => (
  <span class={look ? `sheet-icon ${look}` : 'sheet-icon'}>
    <Icon name={name} stroke={name === 'check' ? 3 : 1.8} />
  </span>
);

// Tocar el botón grande abre el lector del celular: la huella la pide el sistema.
export function Touch({
  label,
  doing,
  onTouch,
}: {
  label: string;
  doing: string;
  onTouch: () => Promise<void>;
}) {
  const { busy, run } = useWaiting();
  return (
    <button
      type="button"
      class={busy ? 'touch reading' : 'touch'}
      aria-label={label}
      aria-busy={busy}
      onClick={() => void run(doing, onTouch)}
    >
      <Icon name="fingerprint" stroke={1.6} />
    </button>
  );
}

export function SheetButton({
  look,
  doing,
  onPress,
  closes,
  children,
}: {
  look: 'orange' | 'green' | 'plain';
  doing: string;
  onPress: () => unknown;
  closes?: boolean;
  children: ComponentChildren;
}) {
  const { busy, run } = useWaiting();
  return (
    <button
      type="button"
      class={`sheet-button ${look}`}
      aria-busy={busy}
      data-close={closes ? '' : undefined}
      onClick={() => void run(doing, async () => onPress())}
    >
      {children}
    </button>
  );
}
