// La vista previa del rol (maqueta users-roles/final), solo en la computadora: cómo se ve el rol y,
// por parte de la aplicación, cuántos permisos da, con una marca verde si da alguno o gris si no. Al
// pie, que se puede cambiar cuando se quiera.
import {
  type PermissionGroup,
  permissionGroups,
  permissions,
} from '@ferrebress/shared/contracts/permissions';
import { Icon } from '../../../../../ui/icon/Icon.tsx';
import { groupIcons } from '../../../../frame/index.ts';
import type { Draft } from '../../draft.ts';
import { rolesTexts as t } from '../../texts.ts';

const groups = Object.keys(permissionGroups) as PermissionGroup[];

export function RolePreview({ draft }: { draft: Draft }) {
  const name = draft.name.trim() || t.name;
  return (
    <aside class="role-preview desktop-only" aria-label={t.preview}>
      <h3>{t.preview}</h3>
      <p class="role-preview-lead">{draft.id ? t.previewLead : t.previewLeadNew}</p>
      <div class="role-preview-card">
        <span class="roles-icon">
          <Icon name={draft.system ? 'shield-check' : 'users'} />
        </span>
        <b>{name}</b>
        {draft.description.trim() && <span>{draft.description.trim()}</span>}
      </div>
      <ul class="role-preview-groups">
        {groups.map((group) => {
          const count = permissions.filter(
            (one) => one.group === group && draft.permissions.includes(one.id),
          ).length;
          return (
            <li key={group}>
              <span class="users-item-icon">
                <Icon name={groupIcons[group]} size="small" />
              </span>
              <span>
                <b>{permissionGroups[group].name}</b>
                <small>{count ? t.permissions(count) : t.noPermissions}</small>
              </span>
              <span class={count ? 'role-mark on' : 'role-mark'}>
                <Icon name={count ? 'check' : 'minus'} size="small" stroke={3} />
              </span>
            </li>
          );
        })}
      </ul>
      <p class="role-preview-note">
        <Icon name="info" size="small" />
        {t.editLater}
      </p>
    </aside>
  );
}
