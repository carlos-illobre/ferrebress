// «3 Quiénes lo tienen» (02 · R7.5, R7.13, E60): las personas activas que lo tienen, con
// «Sacárselo»; a quienes se les da o se les saca, marcadas hasta guardar, con «Deshacer»; las dadas
// de baja, en una línea aparte, que no se tocan; y «Darle este rol a…», que busca entre las activas.

import {
  type RoleScreenModel,
  rolesTexts as t,
  take,
  undo,
} from '../../../../../modules/users/model.ts';
import { privateProps } from '../../../../../platform/view/private.ts';
import { useShortcutHints } from '../../../../../platform/view/shortcut-hints.ts';
import { Button } from '../../../ui/button/Button.tsx';
import { GivePicker } from './GivePicker.tsx';

type Holder = RoleScreenModel['holders']['people'][number];

function Holder({ role, one }: { role: RoleScreenModel; one: Holder }) {
  const { draft, change } = role;
  return (
    <li class={`role-holder ${one.state ?? ''}`} {...privateProps()}>
      <span class="role-holder-face">{one.initials}</span>
      <span class="role-holder-name">
        <b>
          {one.name}
          {one.self && <span class="role-you">{t.you}</span>}
        </b>
        <span>{one.note}</span>
        {one.error && <small class="role-error">{one.error}</small>}
        {one.selfError && <small class="role-error">{one.selfError}</small>}
      </span>
      {one.state ? (
        <Button
          look="plain"
          size="small"
          icon="undo-2"
          doing={t.undo}
          onPress={() => change(undo(draft, one.id))}
        >
          {t.undo}
        </Button>
      ) : (
        <Button
          look="plain"
          size="small"
          doing={t.take}
          onPress={() => change(take(draft, one.id))}
        >
          {t.take}
        </Button>
      )}
    </li>
  );
}

export function RoleHolders({ role }: { role: RoleScreenModel }) {
  const { holders } = role;
  const keys = useShortcutHints('role');
  return (
    <section class="role-step" aria-labelledby="role-who">
      <header class="role-step-head">
        <span class="role-step-number">3</span>
        <h3 id="role-who">{t.who}</h3>
        <p>{t.whoLead}</p>
      </header>
      {holders.nobody && <p class="role-none">{t.nobodyYet}</p>}
      <ul class="role-holders">
        {holders.people.map((one) => (
          <Holder key={one.id} role={role} one={one} />
        ))}
      </ul>
      {holders.inactive && (
        <p class="role-inactive" {...privateProps()}>
          {holders.inactive}
        </p>
      )}
      <Button icon="user-plus" keyHint={keys.giveTo} doing={t.giveTo} onPress={role.openPicker}>
        {t.giveTo}
      </Button>
      {role.picking && (
        <GivePicker candidates={holders.candidates} pick={role.giveTo} close={role.closePicker} />
      )}
    </section>
  );
}
