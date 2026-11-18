// El nombre de este dispositivo (04 · R9.2, R9.3): «Ponele nombre» o «Cambiar el nombre» abre el
// campo, con la cuenta de letras, las ideas y el aviso si otro se llama igual mientras se escribe;
// «Borrar» vuelve al navegador. El dibujo muestra lo que se escribe, letra por letra.
import { useEffect, useRef } from 'preact/hooks';
import { type NameModel, mineTexts as t } from '../../../../../modules/device-settings/model.ts';
import { useShortcutHints } from '../../../../../platform/view/shortcut-hints.ts';
import { Button } from '../../../ui/button/Button.tsx';
import { Icon } from '../../../ui/icon/Icon.tsx';
import { Say } from '../../../ui/say/Say.tsx';

type Props = { isPhone: boolean; name: NameModel; disabled: boolean };

function Field({ isPhone, name }: Props) {
  // vista: la caja del nombre, para elegir lo escrito al abrirla.
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);
  return (
    <>
      <form
        class="mine-name-edit"
        onSubmit={(event) => {
          event.preventDefault();
          name.submit();
        }}
        autocomplete="off"
      >
        <input
          ref={input}
          value={name.draft}
          maxLength={name.maxTyped}
          placeholder={name.placeholder}
          aria-label={t.name.label(isPhone)}
          onInput={(event) => name.type(event.currentTarget.value)}
        />
        <span class={name.full ? 'mine-count full' : 'mine-count'}>{name.count}</span>
        <button type="submit" class="button button-action button-small" disabled={!name.canSave}>
          {t.name.done}
        </button>
        {/* Lo que hace Esc en la caja (la navegación del teclado); el lector de pantalla sí lo ve. */}
        <button type="button" class="visually-hidden" data-close="" onClick={name.cancel}>
          {t.cancel}
        </button>
      </form>
      <Ideas name={name} />
      {name.repeated && (
        <p class="mine-repeated" role="status">
          <Icon name="triangle-alert" size="small" />
          {t.name.repeated}
        </p>
      )}
    </>
  );
}

function Ideas({ name }: { name: NameModel }) {
  const keys = useShortcutHints('device-settings');
  return (
    <div class="mine-ideas">
      {name.ideas.map((idea, index) => (
        <button
          key={idea}
          type="button"
          class="settings-chip mine-idea"
          data-mark=""
          onClick={() => name.type(idea)}
        >
          {idea}
          {keys[`idea${index + 1}`] && <kbd>{keys[`idea${index + 1}`]}</kbd>}
        </button>
      ))}
    </div>
  );
}

export function Name(props: Props) {
  const { name, isPhone, disabled } = props;
  const keys = useShortcutHints('device-settings');
  if (name.draft !== undefined) return <Field {...props} />;
  return (
    <>
      <Button
        look={name.current ? 'soft' : 'action'}
        size="small"
        icon="pencil-line"
        keyHint={keys.rename}
        doing={name.current ? t.name.change : t.name.put}
        onPress={name.edit}
        disabled={disabled}
      >
        {name.current ? t.name.change : t.name.put}
      </Button>
      {name.current && (
        <Button
          look="plain"
          size="small"
          keyHint={keys.clearName}
          doing={t.name.clear}
          onPress={name.clear}
          disabled={disabled}
        >
          {t.name.clear}
        </Button>
      )}
      <p class="mine-name-note">
        <Say words={t.name.note(isPhone)} />
      </p>
    </>
  );
}
