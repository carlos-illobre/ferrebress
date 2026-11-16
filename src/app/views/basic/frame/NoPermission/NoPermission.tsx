// «Sin permiso» (02 · R7.7; maqueta app-no-permission, variante 1, «La puerta que explica»): al abrir
// por la dirección algo que la persona no puede usar. Dice qué permiso falta y para qué sirve, qué
// roles lo tienen y quiénes son, quién lo puede dar y los roles propios; lleva a la primera opción que
// sí puede usar y copia el pedido. Es del marco: vale para cualquier opción.
import type { PermissionId } from '@ferrebress/shared/contracts/permissions';
import type { HoldersResponse } from '@ferrebress/shared/contracts/roles';
import type { Option } from '../../../../modules/frame/model.ts';
import {
  initials,
  noPermissionWords,
  permissionIcons,
  useNoPermission,
} from '../../../../modules/frame/model.ts';
import { useShortcutHints } from '../../../../platform/view/shortcut-hints.ts';
import { Button } from '../../ui/button/Button.tsx';
import { Icon } from '../../ui/icon/Icon.tsx';
import { Say } from '../../ui/say/Say.tsx';
import { useFrame } from '../context.ts';
import './NoPermission.css';

// `first`: la primera opción que sí puede usar, y cómo ir (las da el marco).
export function NoPermission({
  option,
  first,
  go,
}: {
  option: Option & { permission: PermissionId };
  first: Option;
  go: () => void;
}) {
  const { person } = useFrame();
  const { permission, holders, address, copy } = useNoPermission(person, option);
  const keys = useShortcutHints('no-permission');
  return (
    <section class="surface no-permission" aria-label={noPermissionWords.title(option.name)}>
      <div class="no-permission-door" aria-hidden="true">
        <Icon name="lock" size="huge" />
      </div>
      <div class="no-permission-body">
        <h1>{noPermissionWords.title(option.name)}</h1>
        <p class="no-permission-path">{noPermissionWords.opened(address)}</p>
        <div class="no-permission-needs">
          <span class="no-permission-icon">
            <Icon name={permissionIcons[option.permission]} />
          </span>
          <div>
            <b>
              <Say words={noPermissionWords.needs} /> «{permission.name}»
            </b>
            <small>{permission.explanation}</small>
          </div>
        </div>
        {holders && <Holders holders={holders} />}
        <p class="no-permission-yours">
          {noPermissionWords.yours}
          {person.roles.map((role) => (
            <span key={role.id} class="pill">
              {role.name}
            </span>
          ))}
        </p>
        <div class="no-permission-actions">
          <Button
            look="action"
            icon={first.icon}
            doing={noPermissionWords.going}
            onPress={go}
            primary
          >
            {noPermissionWords.goTo(first.name)}
          </Button>
          <Button icon="copy" doing={noPermissionWords.copying} onPress={copy} keyHint={keys.copy}>
            {noPermissionWords.copy}
          </Button>
        </div>
      </div>
    </section>
  );
}

// Los roles que tienen el permiso, con sus personas, y quién lo puede dar. Solo nombres (R7.7).
function Holders({ holders }: { holders: HoldersResponse }) {
  const people = new Set(holders.roles.flatMap((role) => role.people)).size;
  return (
    <>
      <div class="no-permission-head">
        <span>{noPermissionWords.holders}</span>
        <span>{noPermissionWords.count(holders.roles.length, people)}</span>
      </div>
      {holders.roles.length === 0 ? (
        <p class="no-permission-nobody">{noPermissionWords.nobody}</p>
      ) : (
        <ul class="no-permission-roles" data-private="">
          {holders.roles.map((role) => (
            <li key={role.id}>
              <span class="no-permission-icon">
                <Icon name="shield" size="small" />
              </span>
              <b>{role.name}</b>
              <span class="no-permission-faces" aria-hidden="true">
                {role.people.slice(0, 4).map((name) => (
                  <span key={name} class="avatar">
                    {initials(name)}
                  </span>
                ))}
              </span>
              <small>{noPermissionWords.people(role.people.length)}</small>
            </li>
          ))}
        </ul>
      )}
      {holders.grantedBy.length > 0 && (
        <p class="no-permission-granted" data-private="">
          <Say words={noPermissionWords.grantedBy} />{' '}
          {holders.grantedBy.map((name, index) => (
            <span key={name}>
              {index > 0 && (index === holders.grantedBy.length - 1 ? ' o ' : ', ')}
              <b>{name}</b>
            </span>
          ))}
          .
        </p>
      )}
    </>
  );
}
