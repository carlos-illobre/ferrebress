// «Ya no tenés permiso» (02 · R7.8; maqueta app-no-permission, variante 1): le sacaron el permiso de la
// pantalla abierta mientras la usaba. Dice quién le sacó qué rol, los roles que tenía y los que tiene,
// que lo de otras pantallas sigue como lo dejó, y a los 5 segundos va solo a su primera opción, o
// antes con el botón.
import {
  type LostPermission,
  noPermissionWords,
  type Option,
  usePermissionLost,
} from '../../../../modules/frame/model.ts';
import { Button } from '../../ui/button/Button.tsx';
import { Dialog } from '../../ui/dialog/Dialog.tsx';
import { Icon } from '../../ui/icon/Icon.tsx';
import './PermissionLost.css';
import { privateProps } from '../../../../platform/view/private.ts';

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
    <Dialog label={noPermissionWords.lostTitle(lost.option.name)} className="lost-permission">
      <h2>
        <span class="lost-permission-icon">
          <Icon name="lock" />
        </span>
        {noPermissionWords.lostTitle(lost.option.name)}
      </h2>
      {removed.length > 0 ? (
        <p {...privateProps()}>
          <b>{after.rolesChangedBy ?? noPermissionWords.someone}</b>
          {noPermissionWords.tookAway(removed)}
        </p>
      ) : (
        <p>{noPermissionWords.roleChanged}</p>
      )}
      <dl class="lost-permission-roles">
        <dt>{noPermissionWords.had}</dt>
        <dd>
          {had.map((role) => (
            <span key={role.id} class={role.gone ? 'pill pill-gone' : 'pill'}>
              {role.name}
            </span>
          ))}
        </dd>
        <dt>{noPermissionWords.have}</dt>
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
        {noPermissionWords.kept}
      </p>
      <footer>
        <span class="lost-permission-count" aria-live="polite">
          <b style={{ '--part': String(part) }}>{left}</b> {noPermissionWords.leaving(first.name)}
        </span>
        <Button
          look="action"
          icon={first.icon}
          doing={noPermissionWords.going}
          onPress={onGo}
          primary
        >
          {noPermissionWords.goNow(first.name)}
        </Button>
      </footer>
    </Dialog>
  );
}
