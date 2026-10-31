// Cambiar el nombre o el correo en la tarjeta (R3.5, R3.6): el lápiz lo vuelve una caja; Enter
// guarda y Esc cancela. Un correo que no se puede usar se dice debajo, sin perder lo escrito (R3.3).
import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { cardTexts, refusalTexts } from '../../texts.ts';

type Props = {
  value: string;
  shown: string;
  label: string;
  placeholder: string;
  className: string;
  // Devuelve el rechazo que va junto al campo, si hay.
  save: (value: string) => Promise<string | undefined>;
};

function Box({ props, done }: { props: Props; done: () => void }) {
  const [error, setError] = useState<string>();
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.select(), []);
  const keys = async (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      done();
    }
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const refused = await props.save((input.current as HTMLInputElement).value);
    if (refused) setError(refusalTexts[refused]);
    else done();
  };
  return (
    <div class={error ? 'users-edit wrong' : 'users-edit'}>
      <input
        ref={input}
        aria-label={props.label}
        aria-invalid={!!error}
        value={props.value}
        placeholder={props.placeholder}
        autocomplete="off"
        onKeyDown={(event) => void keys(event)}
        onInput={() => setError(undefined)}
        onBlur={done}
      />
      <span class="users-edit-help" role={error ? 'alert' : undefined}>
        {error ?? cardTexts.editHelp}
      </span>
    </div>
  );
}

export function Editable(props: Props) {
  const [editing, setEditing] = useState(false);
  if (editing) return <Box props={props} done={() => setEditing(false)} />;
  return (
    <div class={props.className}>
      <span>{props.shown}</span>
      <button
        type="button"
        class="users-pencil"
        aria-label={props.label}
        data-mark=""
        onClick={() => setEditing(true)}
      >
        <Icon name="pencil" size="small" />
      </button>
    </div>
  );
}
