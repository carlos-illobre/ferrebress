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
  look?: 'common' | 'action' | 'dark' | 'plain' | 'danger' | 'soft' | 'red';
  size?: 'small' | 'large';
  icon?: IconName;
  // Alt más esta tecla lo aprieta en la computadora (una letra o un número), en las pantallas que
  // todavía no declaran sus atajos.
  shortcut?: string;
  // La tecla de su atajo, del mapa (platform/view/shortcut-hints.ts): solo se muestra.
  keyHint?: string | undefined;
  // Lo que hace Esc en su capa.
  closes?: boolean;
  // El principal de un diálogo: el cursor arranca ahí en la computadora y Enter lo toca.
  primary?: boolean;
  // Lo que hace Enter con el cursor en una caja de la pantalla y nada marcado (00 · R2.6).
  enterDoes?: boolean;
  disabled?: boolean;
};

// Lo que el teclado necesita saber del botón (00 · R2): su tecla, que lo recorren las flechas, si es
// lo que hace Esc y si es el principal.
const keyboardMarks = (props: ButtonProps) => ({
  'data-mark': '',
  'data-key': props.shortcut,
  'data-close': props.closes ? '' : undefined,
  'data-primary': props.primary ? '' : undefined,
  'data-default': props.enterDoes ? '' : undefined,
});

function Contents(props: ButtonProps) {
  const shown = props.keyHint ?? props.shortcut?.toUpperCase();
  return (
    <>
      {props.icon && <Icon name={props.icon} {...(props.size === 'small' && { size: 'small' })} />}
      <span>{props.children}</span>
      {shown && <kbd>{shown}</kbd>}
    </>
  );
}

export function Button(props: ButtonProps) {
  const { phase, busy, run } = useWaiting();
  const waiting = phase === 'mark' || phase === 'bar';
  const classes = [
    'button',
    `button-${props.look ?? 'common'}`,
    props.size && `button-${props.size}`,
    // La marca de espera sigue girando aunque se apaguen las animaciones (04 · R2.2).
    waiting && 'keeps-moving',
  ];
  return (
    <button
      type="button"
      class={classes.filter(Boolean).join(' ')}
      disabled={props.disabled}
      aria-busy={busy}
      data-wait={waiting ? '' : undefined}
      {...keyboardMarks(props)}
      onClick={() => {
        void run(props.doing, async () => props.onPress());
      }}
    >
      <Contents {...props} />
    </button>
  );
}
