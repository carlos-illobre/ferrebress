// «Darle este rol a…» (02 · R7.13): elegir a una persona activa que todavía no lo tiene, buscando
// por nombre o correo. Suma un paso al historial: atrás la cierra sin preguntar por el rol.
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import { rolesTexts as t, useGivePicker } from '../../../../../modules/users/model.ts';
import { useBackStep } from '../../../../../platform/view/back-step.ts';
import { privateProps } from '../../../../../platform/view/private.ts';
import { Button } from '../../../ui/button/Button.tsx';
import { Dialog } from '../../../ui/dialog/Dialog.tsx';
import { Icon } from '../../../ui/icon/Icon.tsx';
import { Search } from '../../../ui/search/Search.tsx';

type Props = { candidates: PersonRow[]; pick: (id: string) => void; close: () => void };

export function GivePicker({ candidates, pick, close }: Props) {
  const { query, setQuery, shown } = useGivePicker(candidates);
  useBackStep(close);
  return (
    <Dialog label={t.pick} className="role-give">
      <h2>{t.pick}</h2>
      <Search
        look="roles-search"
        masked
        icon={<Icon name="search" size="small" />}
        aria-label={t.pickSearch}
        placeholder={t.pickSearch}
        value={query}
        onText={setQuery}
        data-autofocus=""
      />
      {shown.length === 0 && <p class="role-none">{t.pickNone}</p>}
      <ul class="role-give-list" {...privateProps()}>
        {shown.map((one) => (
          <li key={one.id}>
            <button
              type="button"
              class="role-give-person"
              onClick={() => pick(one.id)}
              data-mark=""
            >
              <span class="role-holder-face">{one.initials}</span>
              <span class="role-holder-name">
                <b>{one.name}</b>
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
