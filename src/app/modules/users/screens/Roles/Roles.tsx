// La pestaña Roles (R7.3; maqueta users-roles, variante 1, «El rol y su tarjeta»): cuántos roles y
// personas hay, quién puede qué sumando sus roles, la lista de roles con sus permisos y quiénes los
// tienen, y al costado la tarjeta del rol elegido o el rol nuevo. Se baja recién al abrirla.
import { permissions } from '@ferrebress/shared/contracts/permissions';
import type { RoleRow } from '@ferrebress/shared/contracts/roles';
import { useEffect } from 'preact/hooks';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { person as me } from '../../../sign-in/index.ts';
import { initialsOf } from '../../logic.ts';
import { useUsersContext } from '../../state.ts';
import { roleTexts as t } from '../../texts.ts';
import { NewRole } from './NewRole.tsx';
import { RoleCard } from './RoleCard.tsx';
import './Roles.css';

const nameOf = (id: string) => permissions.find((one) => one.id === id)?.name ?? id;

// Quién puede qué (maqueta): cuántas personas activas tienen cada permiso de Usuarios.
function WhoCan({ rows }: { rows: RoleRow[] }) {
  const holders = new Set(rows.flatMap((role) => role.holders));
  const withIt = (id: string) =>
    new Set(
      rows
        .filter((role) => (role.permissions as string[]).includes(id))
        .flatMap((role) => role.holders),
    ).size;
  return (
    <section class="roles-who-can" aria-label={t.whoCan}>
      <header>
        <span>{t.whoCan}</span>
        <span>{t.ofPeople(holders.size)}</span>
      </header>
      {permissions.map((one) => (
        <div key={one.id} class="roles-bar">
          <span>{one.name}</span>
          <span class="roles-meter" aria-hidden="true">
            <span style={{ width: `${(100 * withIt(one.id)) / Math.max(holders.size, 1)}%` }} />
          </span>
          <b>{withIt(one.id)}</b>
        </div>
      ))}
    </section>
  );
}

function Stats({ rows }: { rows: RoleRow[] }) {
  const people = new Set(rows.flatMap((role) => role.holders)).size;
  return (
    <div class="roles-stats">
      <div class="roles-stat">
        <Icon name="shield" />
        <b>{rows.length}</b>
        <span>{t.roles}</span>
      </div>
      <div class="roles-stat">
        <Icon name="users" />
        <b>{people}</b>
        <span>{t.people}</span>
      </div>
    </div>
  );
}

function Row({ role }: { role: RoleRow }) {
  const users = useUsersContext();
  const mine = me.get()?.roles.some((one) => one.id === role.id);
  const people = users.people ?? [];
  const faces = people.filter((one) => role.holders.includes(one.id)).slice(0, 4);
  return (
    <button
      type="button"
      class="roles-row"
      data-mark=""
      aria-current={users.roleCard === role.id ? 'true' : undefined}
      onClick={() => users.setRoleCard(role.id)}
    >
      <span class="roles-row-icon">
        <Icon name={role.system ? 'shield-check' : 'shield'} />
      </span>
      <span class="roles-row-text">
        <b>
          {role.name}
          {mine && <span class="users-pill you">{t.yours}</span>}
        </b>
        <small>{role.permissions.map(nameOf).join(' · ')}</small>
      </span>
      <span class="roles-faces" aria-hidden="true" data-private="">
        {faces.length === 0
          ? t.nobody
          : faces.map((one) => (
              <span key={one.id} class="users-avatar tone-0">
                {initialsOf(one)}
              </span>
            ))}
      </span>
      <span class="roles-count">
        <b>{role.holders.length}</b>
        <small>{t.holders(role.holders.length)}</small>
      </span>
      <Icon name="chevron-right" size="small" />
    </button>
  );
}

export function Roles() {
  const users = useUsersContext();
  const rows = users.roleRows;
  // Sin ninguno elegido, el primero, como la tarjeta de una persona.
  useEffect(() => {
    if (rows?.[0] && !users.roleCard) users.setRoleCard(rows[0].id);
  }, [rows, users.roleCard]);
  if (!rows)
    return (
      <p class="users-empty" aria-busy="true">
        {t.loading}
      </p>
    );
  const chosen = rows.find((role) => role.id === users.roleCard);
  return (
    <div class="users-body roles-body">
      <div class="users-left">
        <div class="roles-top">
          <Stats rows={rows} />
          <WhoCan rows={rows} />
        </div>
        <h3 class="roles-list-title">{t.list}</h3>
        <div class="roles-list">
          {rows.map((role) => (
            <Row key={role.id} role={role} />
          ))}
        </div>
      </div>
      {users.roleCard === 'new' ? <NewRole /> : chosen ? <RoleCard role={chosen} /> : null}
    </div>
  );
}
