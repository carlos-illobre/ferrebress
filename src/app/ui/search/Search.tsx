// La caja para buscar de «Mostrador»: la lupa y lo que se escribe. Cada pantalla le da su alto con
// su clase. El texto de adentro no se puede cambiar con el CSS: se elige al dibujarlo, al día con el
// ancho (00 · R3.2). `masked`: lo que se busca son nombres o correos, que las capturas tapan.
import type { ComponentChildren, Ref } from 'preact';
import { useNarrow } from '../../platform/narrow.ts';
import type { Words } from '../say/Say.tsx';
import './search.css';

// Lo que pasa tal cual a la caja: las marcas del teclado (/, Esc y foco al abrir) y su largo.
type Input = {
  value: string;
  'aria-label': string;
  maxLength?: number;
  ref?: Ref<HTMLInputElement>;
  onKeyDown?: (event: KeyboardEvent) => unknown;
  'data-slash'?: '' | undefined;
  'data-clear'?: '';
  'data-autofocus'?: '' | undefined;
};

type SearchProps = Input & {
  look: string;
  icon: ComponentChildren;
  placeholder: Words | string;
  onText: (value: string) => void;
  masked?: boolean;
  children?: ComponentChildren;
};

export function Search({
  look,
  icon,
  placeholder,
  onText,
  masked,
  children,
  ...input
}: SearchProps) {
  const narrow = useNarrow();
  const words = typeof placeholder === 'string' ? undefined : placeholder;
  return (
    <label class={`search ${look}`} data-private={masked ? '' : undefined}>
      {icon}
      <input
        type="search"
        autocomplete="off"
        placeholder={words ? (narrow ? words.short : words.long) : (placeholder as string)}
        onInput={(event) => onText(event.currentTarget.value)}
        {...input}
      />
      {children}
    </label>
  );
}
