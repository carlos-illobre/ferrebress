// La vista previa del rol (maqueta users-roles/final), solo en la computadora: cómo se ve el rol y,
// por parte de la aplicación, cuántos permisos da, con una marca verde si da alguno o gris si no. Al
// pie, que se puede cambiar cuando se quiera.
import {
  groupIcons,
  type RoleScreenModel,
  rolesTexts as t,
} from '../../../../../modules/users/model.ts';
import { Icon } from '../../../ui/icon/Icon.tsx';

export function RolePreview({ role }: { role: RoleScreenModel }) {
  const { preview } = role;
  return (
    <aside class="role-preview desktop-only" aria-label={t.preview}>
      <h3>{t.preview}</h3>
      <p class="role-preview-lead">{preview.lead}</p>
      <div class="role-preview-card">
        <span class="roles-icon">
          <Icon name={role.draft.system ? 'shield-check' : 'users'} />
        </span>
        <b>{preview.name}</b>
        {preview.description && <span>{preview.description}</span>}
      </div>
      <ul class="role-preview-groups">
        {preview.groups.map((group) => (
          <li key={group.group}>
            <span class="users-item-icon">
              <Icon name={groupIcons[group.group]} size="small" />
            </span>
            <span>
              <b>{group.name}</b>
              <small>{group.text}</small>
            </span>
            <span class={group.on ? 'role-mark on' : 'role-mark'}>
              <Icon name={group.on ? 'check' : 'minus'} size="small" stroke={3} />
            </span>
          </li>
        ))}
      </ul>
      <p class="role-preview-note">
        <Icon name="info" size="small" />
        {t.editLater}
      </p>
    </aside>
  );
}
