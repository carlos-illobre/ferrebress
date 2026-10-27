// El botón de «Mostrador». Declara lo que el teclado necesita (00 · R2: su tecla, si lo recorren las
// flechas, si es lo que hace Esc) y maneja su espera (00 · R7): si lo que hace tarda, muestra la
// marca y no se puede volver a tocar hasta que termine.
import type { ComponentChildren } from 'preact';
import { useWaiting } from '../../platform/waiting.ts';
import { Icon, type IconName } from '../icon/Icon.tsx';
import './button.css';

export type ButtonProps = {
  children: ComponentChildren;
  // Qué hace, en palabras, para la barra de espera de 2 segundos.
  doing: string;
  onPress: () => unknown;
  look?: 'common' | 'action' | 'dark' | 'plain';
  size?: 'small' | 'large';
  icon?: IconName;
  // Alt más esta tecla lo aprieta en la computadora (una letra o un número).
  shortcut?: string;
  // Lo que hace Esc en su capa.
  closes?: boolean;
  disabled?: boolean;
};

export function Button(props: ButtonProps) {
  const { phase, busy, run } = useWaiting();
  const classes = [
    'button',
    `button-${props.look ?? 'common'}`,
    props.size && `button-${props.size}`,
  ];
  return (
    <button
      type="button"
      class={classes.filter(Boolean).join(' ')}
      disabled={props.disabled}
      aria-busy={busy}
      data-wait={phase === 'mark' || phase === 'bar' ? '' : undefined}
      data-mark=""
      data-key={props.shortcut}
      data-close={props.closes ? '' : undefined}
      onClick={() => {
        void run(props.doing, async () => props.onPress());
      }}
    >
      {props.icon && <Icon name={props.icon} />}
      <span>{props.children}</span>
      {props.shortcut && <kbd>{props.shortcut.toUpperCase()}</kbd>}
    </button>
  );
}
