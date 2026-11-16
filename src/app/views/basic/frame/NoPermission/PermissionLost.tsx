// «Ya no tenés permiso» (02 · R7.8; maqueta app-no-permission, variante 1): le sacaron el permiso de la
// pantalla abierta mientras la usaba. Dice quién le sacó qué rol, los roles que tenía y los que tiene,
// que lo de otras pantallas sigue como lo dejó, y a los 5 segundos va solo a su primera opción, o
// antes con el botón.
import {
  type LostPermission,
  type Option,
  usePermissionLost,
} from '../../../../modules/frame/model.ts';
import { words } from '../../../../modules/frame/no-permission-texts.ts';
import { Button } from '../../../../ui/button/Button.tsx';
import { Dialog } from '../../../../ui/dialog/Dialog.tsx';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import './PermissionLost.css';

export function PermissionLost({
  lost,
  first,
  onGo,
}: {
  lost: LostPermission;
  first: Option;
  onGo: () => void;
}) {
  const { left, part, removed, had } = usePermissionLost(lost, onGo);
  const { after } = lost;
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
          {had.map((role) => (
            <span key={role.id} class={role.gone ? 'pill pill-gone' : 'pill'}>
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
          <b style={{ '--part': String(part) }}>{left}</b> {words.leaving(first.name)}
        </span>
        <Button look="action" icon={first.icon} doing={words.going} onPress={onGo} primary>
          {words.goNow(first.name)}
        </Button>
      </footer>
    </Dialog>
  );
}
