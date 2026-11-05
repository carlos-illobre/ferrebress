// «2 Asignar permisos» (02 · R7.1): un grupo por parte de la aplicación, que se pliega, con su ícono
// y «n de m»; al abrir el rol, solo el primero desplegado (pedido de Carlos), y uno con un problema se
// despliega solo. Cada permiso con su casilla, su ícono y, en la computadora, su explicación. Lo
// incluido en otro tildado queda con candado y lo dice al lado (E36).
import {
  type PermissionGroup,
  type PermissionId,
  permissionGroups,
  permissions,
} from '@ferrebress/shared/contracts/permissions';
import { useState } from 'preact/hooks';
import { Icon } from '../../../../../ui/icon/Icon.tsx';
import { groupIcons, permissionIcons } from '../../../../frame/index.ts';
import { type Draft, type DraftErrors, tiedBy, toggle } from '../../draft.ts';
import { rolesTexts as t } from '../../texts.ts';
import { selfProblem } from './Problems.tsx';

const groups = Object.keys(permissionGroups) as PermissionGroup[];
const inGroup = (group: PermissionGroup) => permissions.filter((one) => one.group === group);
const quoted = (ids: PermissionId[]) =>
  ids.map((id) => `«${permissions.find((one) => one.id === id)?.name}»`);

// `self`: el permiso que quien guarda se sacaría a sí mismo (E56); el motivo va en su renglón.
function Item({
  draft,
  change,
  id,
  self,
}: {
  draft: Draft;
  change: (draft: Draft) => void;
  id: PermissionId;
  self: string | undefined;
}) {
  const permission = permissions.find((one) => one.id === id) as (typeof permissions)[number];
  const on = draft.permissions.includes(id);
  const tied = on ? tiedBy(draft, id) : [];
  return (
    <label class={tied.length ? 'role-permission tied' : 'role-permission'}>
      <input
        type="checkbox"
        checked={on}
        disabled={tied.length > 0}
        onChange={() => change(toggle(draft, id))}
      />
      <span class="role-permission-icon">
        <Icon name={permissionIcons[id]} size="small" />
      </span>
      <span class="role-permission-text">
        <b>{permission.name}</b>
        <span class="desktop-only">{permission.explanation}</span>
        {tied.length > 0 && (
          <small class="role-tied">
            <Icon name="lock" size="small" />
            <span class="desktop-only">{t.tiedLong(quoted(tied), tied.length > 1)}</span>
            <span class="phone-only">{t.tiedShort(quoted(tied))}</span>
          </small>
        )}
        {self === id && !on && <small class="role-error">{selfProblem(id)}</small>}
      </span>
    </label>
  );
}

function Group(props: {
  draft: Draft;
  change: (draft: Draft) => void;
  group: PermissionGroup;
  open: boolean;
  flip: () => void;
  self: string | undefined;
}) {
  const { draft, group } = props;
  const items = inGroup(group);
  const count = items.filter((one) => draft.permissions.includes(one.id)).length;
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
          <Icon name={groupIcons[group]} />
        </span>
        <span class="role-group-name">
          <b>{permissionGroups[group].name}</b>
          <span class="desktop-only">{permissionGroups[group].detail}</span>
        </span>
        <span class={count ? 'role-group-count some' : 'role-group-count'}>
          {t.ofTotal(count, items.length)}
        </span>
        <Icon name={props.open ? 'chevron-up' : 'chevron-down'} size="small" />
      </button>
      {props.open && (
        <div class="role-group-body">
          {items.map((one) => (
            <Item key={one.id} draft={draft} change={props.change} id={one.id} self={props.self} />
          ))}
        </div>
      )}
    </div>
  );
}

// El grupo del permiso que quien guarda se sacaría: se despliega solo, para que se vea.
const selfGroup = (errors: DraftErrors | undefined) =>
  errors?.self && permissions.find((one) => one.id === errors.self)?.group;

type Props = { draft: Draft; change: (draft: Draft) => void; errors: DraftErrors | undefined };

export function RolePermissions({ draft, change, errors }: Props) {
  // local: los grupos desplegados.
  const [open, setOpen] = useState<PermissionGroup[]>(groups.slice(0, 1));
  const flip = (group: PermissionGroup) => () =>
    setOpen((now) => (now.includes(group) ? now.filter((one) => one !== group) : [...now, group]));
  return (
    <section class="role-step" aria-labelledby="role-permissions">
      <header class="role-step-head">
        <span class="role-step-number">2</span>
        <h3 id="role-permissions">{t.assign}</h3>
        <p>{t.assignLead}</p>
      </header>
      {errors?.permissions && <small class="role-error">{t.noPermissionsError}</small>}
      <div class="role-groups">
        {groups.map((group) => (
          <Group
            key={group}
            draft={draft}
            change={change}
            group={group}
            open={open.includes(group) || selfGroup(errors) === group}
            self={errors?.self}
            flip={flip(group)}
          />
        ))}
      </div>
    </section>
  );
}
