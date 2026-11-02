// «Darle este rol a…» (02 · R7.13): elegir a una persona activa que todavía no lo tiene, buscando
// por nombre o correo. Suma un paso al historial: atrás la cierra sin preguntar por el rol.
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import { useState } from 'preact/hooks';
import { useBackStep } from '../../../../../platform/back-step.ts';
import { plain } from '../../../../../platform/text.ts';
import { Button } from '../../../../../ui/button/Button.tsx';
import { Dialog } from '../../../../../ui/dialog/Dialog.tsx';
import { Icon } from '../../../../../ui/icon/Icon.tsx';
import { initialsOf } from '../../../logic.ts';
import { rolesTexts as t } from '../../texts.ts';

type Props = { candidates: PersonRow[]; pick: (id: string) => void; close: () => void };

export function GivePicker({ candidates, pick, close }: Props) {
  const [query, setQuery] = useState('');
  useBackStep(close);
  const wanted = plain(query.trim());
  const shown = candidates.filter((one) =>
    plain(`${one.displayName} ${one.email}`).includes(wanted),
  );
  return (
    <Dialog label={t.pick} className="role-give">
      <h2>{t.pick}</h2>
      <label class="roles-search" data-private="">
        <Icon name="search" size="small" />
        <input
          type="search"
          value={query}
          placeholder={t.pickSearch}
          aria-label={t.pickSearch}
          data-autofocus=""
          onInput={(event) => setQuery(event.currentTarget.value)}
        />
      </label>
      {shown.length === 0 && <p class="role-none">{t.pickNone}</p>}
      <ul class="role-give-list" data-private="">
        {shown.map((one) => (
          <li key={one.id}>
            <button
              type="button"
              class="role-give-person"
              onClick={() => pick(one.id)}
              data-mark=""
            >
              <span class="role-holder-face">{initialsOf(one)}</span>
              <span class="role-holder-name">
                <b>{one.displayName}</b>
                <span>{one.email}</span>
              </span>
              <Icon name="plus" size="small" />
            </button>
          </li>
        ))}
      </ul>
      <Button look="plain" doing={t.close} onPress={close} closes>
        {t.close}
      </Button>
    </Dialog>
  );
}
