// Las opciones de un ajuste (R1.8): botones de una sola elección, el elegido apretado. Con el teclado se llega con la tecla
// del ajuste y se recorren con ← y →; Enter o Espacio la eligen. Al pasar el mouse por una, el panel
// muestra lo que haría antes de tocarla (la variante 2 de la maqueta).
import type { JSX } from 'preact';

type OptionsProps<T extends number> = {
  label: string;
  values: readonly T[];
  chosen: T;
  initial: T;
  disabled: boolean;
  look?: string;
  // Qué dice cada opción y lo que haría.
  text: (value: T) => JSX.Element | string;
  effect: (value: T) => string;
  onLook: (value: T | undefined) => void;
  onChoose: (value: T) => void;
};

// ← y → mueven el cursor entre las opciones de ese grupo, sin elegir.
function move(event: KeyboardEvent) {
  const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
  const here = event.target as HTMLElement;
  const all = [...(here.parentElement as HTMLElement).children] as HTMLElement[];
  const next = all[all.indexOf(here) + step];
  if (!step || !next) return;
  event.preventDefault();
  next.focus();
}

export function Options<T extends number>(props: OptionsProps<T>) {
  const { values, chosen, initial, disabled, text, effect, onLook, onChoose } = props;
  return (
    <fieldset class={`admin-options ${props.look ?? ''}`} aria-label={props.label}>
      {values.map((value) => (
        <button
          key={value}
          type="button"
          class="admin-option"
          aria-pressed={value === chosen}
          tabIndex={value === chosen ? 0 : -1}
          disabled={disabled}
          onKeyDown={move}
          onMouseEnter={() => onLook(value)}
          onMouseLeave={() => onLook(undefined)}
          onFocus={() => onLook(value)}
          onClick={() => value !== chosen && onChoose(value)}
        >
          {value === initial && <span class="admin-initial">de arranque</span>}
          <span class="admin-option-value">{text(value)}</span>
          <span class="admin-option-effect">{effect(value)}</span>
        </button>
      ))}
    </fieldset>
  );
}
