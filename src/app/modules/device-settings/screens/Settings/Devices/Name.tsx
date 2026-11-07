// El nombre de este dispositivo (04 · R9.2, R9.3): «Ponele nombre» o «Cambiar el nombre» abre el
// campo, con la cuenta de letras, las ideas y el aviso si otro se llama igual mientras se escribe;
// «Borrar» vuelve al navegador. El dibujo muestra lo que se escribe, letra por letra.
import {
  cleanDeviceName,
  deviceNameMax,
  isRepeated,
} from '@ferrebress/shared/contracts/device-settings';
import { lettersIn } from '@ferrebress/shared/text/clean';
import { useEffect, useRef } from 'preact/hooks';
import { Button } from '../../../../../ui/button/Button.tsx';
import { Icon } from '../../../../../ui/icon/Icon.tsx';
import { Say } from '../../../../../ui/say/Say.tsx';
import { mineTexts as t } from '../../../mine/texts.ts';

export type Draft = { text: string } | undefined;

type Props = {
  isPhone: boolean;
  name: string | undefined;
  names: string[];
  ideas: string[];
  draft: Draft;
  setDraft: (draft: Draft) => void;
  save: (name: string) => unknown;
  disabled: boolean;
};

function Field({
  isPhone,
  names,
  ideas,
  draft,
  setDraft,
  save,
}: Props & { draft: { text: string } }) {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);
  const letters = lettersIn(draft.text.trim());
  const clean = cleanDeviceName(draft.text);
  const submit = (event: Event) => {
    event.preventDefault();
    if (clean !== undefined) void save(clean ?? '');
  };
  return (
    <>
      <form class="mine-name-edit" onSubmit={submit} autocomplete="off">
        <input
          ref={input}
          value={draft.text}
          maxLength={deviceNameMax * 2}
          placeholder={t.name.example(ideas[0] as string)}
          aria-label={t.name.label(isPhone)}
          onInput={(event) => setDraft({ text: event.currentTarget.value })}
          onKeyDown={(event) => event.key === 'Escape' && setDraft(undefined)}
        />
        <span class={letters > deviceNameMax ? 'mine-count full' : 'mine-count'}>
          {letters}/{deviceNameMax}
        </span>
        <button
          type="submit"
          class="button button-action button-small"
          disabled={clean === undefined}
        >
          {t.name.done}
        </button>
      </form>
      <Ideas ideas={ideas} choose={(text) => setDraft({ text })} />
      {clean && isRepeated(clean, names) && (
        <p class="mine-repeated" role="status">
          <Icon name="triangle-alert" size="small" />
          {t.name.repeated}
        </p>
      )}
    </>
  );
}

function Ideas({ ideas, choose }: { ideas: string[]; choose: (text: string) => void }) {
  return (
    <div class="mine-ideas">
      {ideas.map((idea, index) => (
        <button
          key={idea}
          type="button"
          class="settings-chip mine-idea"
          data-mark=""
          data-key={String(index + 1)}
          onClick={() => choose(idea)}
        >
          {idea}
          <kbd>{index + 1}</kbd>
        </button>
      ))}
    </div>
  );
}

export function Name(props: Props) {
  const { name, draft, setDraft, save, isPhone, disabled } = props;
  if (draft) return <Field {...props} draft={draft} />;
  return (
    <>
      <Button
        look={name ? 'soft' : 'action'}
        size="small"
        icon="pencil-line"
        shortcut="k"
        doing={name ? t.name.change : t.name.put}
        onPress={() => setDraft({ text: name ?? '' })}
        disabled={disabled}
      >
        {name ? t.name.change : t.name.put}
      </Button>
      {name && (
        <Button
          look="plain"
          size="small"
          shortcut="b"
          doing={t.name.clear}
          onPress={() => save('')}
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
