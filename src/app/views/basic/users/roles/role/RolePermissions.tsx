// «2 Asignar permisos» (02 · R7.1): un grupo por parte de la aplicación, que se pliega, con su ícono
// y «n de m»; al abrir el rol, solo el primero desplegado (pedido de Carlos), y uno con un problema se
// despliega solo. Cada permiso con su casilla, su ícono y, en la computadora, su explicación. Lo
// incluido en otro tildado queda con candado y lo dice al lado (E36).
import type { PermissionGroup } from '@ferrebress/shared/contracts/permissions';
import { useState } from 'preact/hooks';
import {
  groupIcons,
  permissionIcons,
  type RoleScreenModel,
  rolesTexts as t,
  toggle,
} from '../../../../../modules/users/model.ts';
import { Icon } from '../../../ui/icon/Icon.tsx';

type Lines = RoleScreenModel['permissionLines'];
type GroupLines = Lines['groups'][number];

function Item({ role, one }: { role: RoleScreenModel; one: GroupLines['items'][number] }) {
  return (
    <label class={one.tied ? 'role-permission tied' : 'role-permission'}>
      <input
        type="checkbox"
        checked={one.on}
        disabled={!!one.tied}
        onChange={() => role.change(toggle(role.draft, one.id))}
      />
      <span class="role-permission-icon">
        <Icon name={permissionIcons[one.id]} size="small" />
      </span>
      <span class="role-permission-text">
        <b>{one.name}</b>
        <span class="desktop-only">{one.explanation}</span>
        {one.tied && (
          <small class="role-tied">
            <Icon name="lock" size="small" />
            <span class="desktop-only">{one.tied.long}</span>
            <span class="phone-only">{one.tied.short}</span>
          </small>
        )}
        {one.error && <small class="role-error">{one.error}</small>}
      </span>
    </label>
  );
}

function Group(props: {
  role: RoleScreenModel;
  group: GroupLines;
  open: boolean;
  flip: () => void;
}) {
  const { group } = props;
  return (
    <div class="role-group">
      <button
        type="button"
        class="role-group-head"
        aria-expanded={props.open}
        onClick={props.flip}
        data-mark=""
      >
        <span class="users-item-icon">
          <Icon name={groupIcons[group.group]} />
        </span>
        <span class="role-group-name">
          <b>{group.name}</b>
          <span class="desktop-only">{group.detail}</span>
        </span>
        <span class={group.some ? 'role-group-count some' : 'role-group-count'}>{group.count}</span>
        <Icon name={props.open ? 'chevron-up' : 'chevron-down'} size="small" />
      </button>
      {props.open && (
        <div class="role-group-body">
          {group.items.map((one) => (
            <Item key={one.id} role={props.role} one={one} />
          ))}
        </div>
      )}
    </div>
  );
}

export function RolePermissions({ role }: { role: RoleScreenModel }) {
  const lines = role.permissionLines;
  // vista: los grupos desplegados; al abrir, solo el primero.
  const [open, setOpen] = useState<PermissionGroup[]>(() =>
    lines.groups.slice(0, 1).map((g) => g.group),
  );
  const flip = (group: PermissionGroup) => () =>
    setOpen((now) => (now.includes(group) ? now.filter((one) => one !== group) : [...now, group]));
  return (
    <section class="role-step" aria-labelledby="role-permissions">
      <header class="role-step-head">
        <span class="role-step-number">2</span>
        <h3 id="role-permissions">{t.assign}</h3>
        <p>{t.assignLead}</p>
      </header>
      {lines.noPermissions && <small class="role-error">{lines.noPermissions}</small>}
      <div class="role-groups">
        {lines.groups.map((group) => (
          <Group
            key={group.group}
            role={role}
            group={group}
            open={open.includes(group.group) || lines.selfGroup === group.group}
            flip={flip(group.group)}
          />
        ))}
      </div>
    </section>
  );
}
