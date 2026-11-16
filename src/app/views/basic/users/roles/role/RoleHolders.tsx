// «3 Quiénes lo tienen» (02 · R7.5, R7.13, E60): las personas activas que lo tienen, con
// «Sacárselo»; a quienes se les da o se les saca, marcadas hasta guardar, con «Deshacer»; las dadas
// de baja, en una línea aparte, que no se tocan; y «Darle este rol a…», que busca entre las activas.

import type { PersonRow } from '@ferrebress/shared/contracts/users';
import {
  type Draft,
  type DraftErrors,
  initialsOf,
  type PersonError,
  type RoleScreenModel,
  roleHoldersOf,
  rolesTexts as t,
  take,
  undo,
} from '../../../../../modules/users/model.ts';
import { useShortcutHints } from '../../../../../platform/view/shortcut-hints.ts';
import { Button } from '../../../../../ui/button/Button.tsx';
import { GivePicker } from './GivePicker.tsx';
import { personProblem, selfProblem } from './Problems.tsx';

type Change = (draft: Draft) => void;

// Qué le pasa al guardar (o su correo) y, si no se puede, por qué.
function Note(props: {
  person: PersonRow;
  given: boolean;
  taken: boolean;
  error: PersonError | undefined;
  self: string | undefined;
}) {
  const { person, given, taken } = props;
  return (
    <>
      <span>{given ? t.willGet : taken ? t.willLose : person.email}</span>
      {props.error && <small class="role-error">{personProblem(props.error, person)}</small>}
      {props.self && taken && <small class="role-error">{selfProblem(props.self)}</small>}
    </>
  );
}

function Holder(props: {
  person: PersonRow;
  draft: Draft;
  change: Change;
  error: PersonError | undefined;
  // Se sacaría a sí misma lo que la deja administrar (E56): el motivo va en su renglón.
  self: string | undefined;
}) {
  const { person, draft, change } = props;
  const given = draft.give.includes(person.id);
  const taken = draft.take.includes(person.id);
  const state = given ? 'given' : taken ? 'taken' : '';
  return (
    <li class={`role-holder ${state}`} data-private="">
      <span class="role-holder-face">{initialsOf(person)}</span>
      <span class="role-holder-name">
        <b>
          {person.displayName}
          {person.self && <span class="role-you">{t.you}</span>}
        </b>
        <Note person={person} given={given} taken={taken} error={props.error} self={props.self} />
      </span>
      {given || taken ? (
        <Button
          look="plain"
          size="small"
          icon="undo-2"
          doing={t.undo}
          onPress={() => change(undo(draft, person.id))}
        >
          {t.undo}
        </Button>
      ) : (
        <Button
          look="plain"
          size="small"
          doing={t.take}
          onPress={() => change(take(draft, person.id))}
        >
          {t.take}
        </Button>
      )}
    </li>
  );
}

export function RoleHolders({ role }: { role: RoleScreenModel }) {
  const { draft, change, errors, people } = role;
  const keys = useShortcutHints('role');
  const shown = [...draft.original.holders, ...draft.give]
    .map((id) => people.find((one) => one.id === id))
    .filter((one): one is PersonRow => !!one);
  const inactive = draft.id
    ? people.filter((one) => !one.active && one.roleIds.includes(draft.id as string))
    : [];
  const holding = roleHoldersOf(draft);
  return (
    <section class="role-step" aria-labelledby="role-who">
      <header class="role-step-head">
        <span class="role-step-number">3</span>
        <h3 id="role-who">{t.who}</h3>
        <p>{t.whoLead}</p>
      </header>
      {shown.length === 0 && <p class="role-none">{t.nobodyYet}</p>}
      <ul class="role-holders">
        {shown.map((person) => (
          <Holder
            key={person.id}
            person={person}
            draft={draft}
            change={change}
            error={errors?.people?.[person.id]}
            self={person.self ? errors?.self : undefined}
          />
        ))}
      </ul>
      {inactive.length > 0 && (
        <p class="role-inactive" data-private="">
          {t.alsoInactive(inactive.map((one) => one.displayName).join(', '))}
        </p>
      )}
      <Button icon="user-plus" keyHint={keys.giveTo} doing={t.giveTo} onPress={role.openPicker}>
        {t.giveTo}
      </Button>
      {role.picking && (
        <GivePicker
          candidates={people.filter((one) => one.active && !holding.includes(one.id))}
          pick={role.giveTo}
          close={role.closePicker}
        />
      )}
    </section>
  );
}
