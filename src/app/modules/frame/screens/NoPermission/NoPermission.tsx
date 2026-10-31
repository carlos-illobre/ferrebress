// «Sin permiso» (02 · R7.7; maqueta app-no-permission, variante 1, «La puerta que explica»): al abrir
// por la dirección algo que la persona no puede usar. Dice qué permiso falta y para qué sirve, qué
// roles lo tienen y quiénes son, quién lo puede dar y los roles propios; lleva a la primera opción que
// sí puede usar y copia el pedido. Es del marco: vale para cualquier opción.
import { type PermissionId, permissionOf } from '@ferrebress/shared/contracts/permissions';
import type { HoldersResponse } from '@ferrebress/shared/contracts/roles';
import { useEffect, useState } from 'preact/hooks';
import { navigate } from '../../../../platform/router.ts';
import { api } from '../../../../platform/server/api.ts';
import { Button } from '../../../../ui/button/Button.tsx';
import { Icon, type IconName } from '../../../../ui/icon/Icon.tsx';
import { Say } from '../../../../ui/say/Say.tsx';
import { showToast } from '../../../../ui/toast/Toast.tsx';
import { initials, useFrame } from '../../context.ts';
import { firstOption, type Option } from '../../menu.ts';
import { texts } from '../../texts.ts';
import './NoPermission.css';

const words = texts.noPermission;

// El ícono de cada permiso, el mismo en la pestaña Roles.
export const permissionIcons: Record<PermissionId, IconName> = {
  'users.view': 'eye',
  'users.manage': 'users',
  'users.cut': 'ban',
  'roles.manage': 'shield',
  'offline.work': 'wifi-off',
};

// Ir a la primera opción que sí puede usar (R1.4).
export const goToFirst = (person: { permissions: readonly string[] }) =>
  navigate(firstOption(person).path ?? '/', { replace: true });

export function NoPermission({ option }: { option: Option & { permission: PermissionId } }) {
  const { person } = useFrame();
  const permission = permissionOf(option.permission);
  const [holders, setHolders] = useState<HoldersResponse>();
  useEffect(() => {
    void api<HoldersResponse>(`/api/permissions/${option.permission}/holders`).then(
      (reply) => reply.ok && setHolders(reply.data),
    );
  }, [option.permission]);
  const first = firstOption(person);
  const copy = async () => {
    await navigator.clipboard.writeText(words.request(person.name, permission.name, option.name));
    showToast(words.copied, 'copy');
  };
  return (
    <section class="no-permission" aria-label={words.title(option.name)}>
      <div class="no-permission-door" aria-hidden="true">
        <Icon name="lock" size="huge" />
      </div>
      <div class="no-permission-body">
        <h1>{words.title(option.name)}</h1>
        <div class="no-permission-needs">
          <span class="no-permission-icon">
            <Icon name={permissionIcons[option.permission]} />
          </span>
          <div>
            <b>
              <Say words={words.needs} /> «{permission.name}»
            </b>
            <small>{permission.explanation}</small>
          </div>
        </div>
        {holders && <Holders holders={holders} />}
        <p class="no-permission-yours">
          {words.yours}
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
            doing={words.going}
            onPress={() => goToFirst(person)}
            primary
          >
            {words.goTo(first.name)}
          </Button>
          <Button icon="copy" doing={words.copying} onPress={copy} shortcut="c">
            {words.copy}
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
        <span>{words.holders}</span>
        <span>{words.count(holders.roles.length, people)}</span>
      </div>
      {holders.roles.length === 0 ? (
        <p class="no-permission-nobody">{words.nobody}</p>
      ) : (
        <ul class="no-permission-roles">
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
              <small>{words.people(role.people.length)}</small>
            </li>
          ))}
        </ul>
      )}
      {holders.grantedBy.length > 0 && (
        <p class="no-permission-granted">
          <Say words={words.grantedBy} />{' '}
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
