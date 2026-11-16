// Cambiar el nombre o el correo en la tarjeta (R3.5, R3.6): el lápiz lo vuelve una caja; Enter
// guarda y Esc cancela. Un correo que no se puede usar se dice debajo, sin perder lo escrito (R3.3).
import { useEffect, useRef } from 'preact/hooks';
import { cardTexts, type EditableModel, useEditable } from '../../../../modules/users/model.ts';
import { Icon } from '../../../../ui/icon/Icon.tsx';

type Props = {
  value: string;
  shown: string;
  label: string;
  placeholder: string;
  className: string;
  // Devuelve el rechazo que va junto al campo, si hay.
  save: (value: string) => Promise<string | undefined>;
};

function Box({ props, edit }: { props: Props; edit: EditableModel }) {
  // vista: la caja aparece con lo escrito elegido, para reemplazarlo de una.
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.select(), []);
  return (
    <form
      class={edit.error ? 'users-edit wrong' : 'users-edit'}
      onSubmit={(event) => {
        event.preventDefault();
        void edit.submit((input.current as HTMLInputElement).value);
      }}
    >
      <input
        ref={input}
        aria-label={props.label}
        aria-invalid={!!edit.error}
        // Sin controlar: al borrar el aviso no vuelve al texto de antes lo que se está escribiendo.
        defaultValue={props.value}
        placeholder={props.placeholder}
        autocomplete="off"
        onInput={edit.typing}
        onBlur={edit.done}
      />
      <span class="users-edit-help" role={edit.error ? 'alert' : undefined}>
        {edit.error ?? cardTexts.editHelp}
      </span>
      {/* Lo que hace Esc en la caja (la navegación del teclado); el lector de pantalla sí lo ve. */}
      <button type="button" class="visually-hidden" data-close="" onClick={edit.done}>
        {cardTexts.cancelEdit}
      </button>
    </form>
  );
}

export function Editable(props: Props) {
  const edit = useEditable(props.save);
  if (edit.editing) return <Box props={props} edit={edit} />;
  return (
    <div class={props.className}>
      <span>{props.shown}</span>
      <button
        type="button"
        class="users-pencil"
        aria-label={props.label}
        data-mark=""
        onClick={edit.start}
      >
        <Icon name="pencil" size="small" />
      </button>
    </div>
  );
}
