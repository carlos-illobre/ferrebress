// «Ya no tenés permiso» (02 · R7.8; maqueta app-no-permission, variante 1): le sacaron el permiso de la
// pantalla abierta mientras la usaba. Dice quién le sacó qué rol, los roles que tenía y los que tiene,
// que lo de otras pantallas sigue como lo dejó, y a los 5 segundos va solo a su primera opción, o
// antes con el botón.
import type { Person } from '@ferrebress/shared/contracts/sign-in';
import { useEffect, useState } from 'preact/hooks';
import { Button } from '../../../../ui/button/Button.tsx';
import { Dialog } from '../../../../ui/dialog/Dialog.tsx';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import type { Option } from '../../menu.ts';
import { words } from './texts.ts';
import './Lost.css';

export const lostSeconds = 5;

export type LostPermission = { option: Option; before: Person; after: Person };

export function Lost({
  lost,
  first,
  onGo,
}: {
  lost: LostPermission;
  first: Option;
  onGo: () => void;
}) {
  const [left, setLeft] = useState(lostSeconds);
  useEffect(() => {
    const timer = setInterval(() => setLeft((seconds) => seconds - 1), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (left <= 0) onGo();
  }, [left, onGo]);
  const { before, after } = lost;
  const kept = new Set(after.roles.map((role) => role.id));
  const removed = before.roles.filter((role) => !kept.has(role.id)).map((role) => role.name);
  return (
    <Dialog label={words.lostTitle(lost.option.name)} className="lost-permission">
      <h2>
        <span class="lost-permission-icon">
          <Icon name="lock" />
        </span>
        {words.lostTitle(lost.option.name)}
      </h2>
      {removed.length > 0 ? (
        <p data-private="">
          <b>{after.rolesChangedBy ?? words.someone}</b>
          {words.tookAway(removed)}
        </p>
      ) : (
        <p>{words.roleChanged}</p>
      )}
      <dl class="lost-permission-roles">
        <dt>{words.had}</dt>
        <dd>
          {before.roles.map((role) => (
            <span key={role.id} class={kept.has(role.id) ? 'pill' : 'pill pill-gone'}>
              {role.name}
            </span>
          ))}
        </dd>
        <dt>{words.have}</dt>
        <dd>
          {after.roles.map((role) => (
            <span key={role.id} class="pill">
              {role.name}
            </span>
          ))}
        </dd>
      </dl>
      <p class="lost-permission-kept">
        <Icon name="check" size="small" />
        {words.kept}
      </p>
      <footer>
        <span class="lost-permission-count" aria-live="polite">
          <b style={{ '--part': String(Math.max(left, 0) / lostSeconds) }}>{Math.max(left, 0)}</b>{' '}
          {words.leaving(first.name)}
        </span>
        <Button look="action" icon={first.icon} doing={words.going} onPress={onGo} primary>
          {words.goNow(first.name)}
        </Button>
      </footer>
    </Dialog>
  );
}
