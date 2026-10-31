// Los permisos de un rol (R7.1; maqueta users-roles, variante 1): agrupados por parte de la
// aplicación, cada uno con lo que deja hacer y su interruptor. Lo que otro tildado incluye queda
// prendido con candado y dice en cuál va incluido.
import {
  type PermissionId,
  permissionGroups,
  permissions,
} from '@ferrebress/shared/contracts/permissions';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { permissionIcons } from '../../../frame/index.ts';
import { roleTexts as t } from '../../texts.ts';

// En cuál de los tildados va incluido, si va.
const includedIn = (id: PermissionId, chosen: readonly string[]) =>
  permissions.find(
    (one) => chosen.includes(one.id) && (one.includes as readonly string[]).includes(id),
  );

export function Permissions({
  chosen,
  onToggle,
  disabled,
}: {
  chosen: readonly string[];
  onToggle: (id: PermissionId) => void;
  disabled?: boolean;
}) {
  return (
    <div class="role-permissions">
      {Object.entries(permissionGroups).map(([group, part]) => (
        <section key={group} class="role-group" aria-label={part.name}>
          <h4>
            {t.part} <b>{part.name}</b>
          </h4>
          {permissions
            .filter((one) => one.group === group)
            .map((one) => {
              const by = includedIn(one.id, chosen);
              const on = chosen.includes(one.id) || !!by;
              return (
                <div key={one.id} class={on ? 'role-permission on' : 'role-permission'}>
                  <span class="role-permission-icon">
                    <Icon name={permissionIcons[one.id]} />
                  </span>
                  <div>
                    <b>{one.name}</b>
                    <small>{one.explanation}</small>
                    {by && (
                      <small class="role-included">
                        <Icon name="lock" size="small" />
                        {t.includedIn(by.name)}
                      </small>
                    )}
                  </div>
                  <button
                    type="button"
                    role="switch"
                    class="role-switch"
                    aria-checked={on}
                    aria-label={one.name}
                    disabled={disabled || !!by}
                    onClick={() => onToggle(one.id)}
                  />
                </div>
              );
            })}
        </section>
      ))}
    </div>
  );
}

// Prender o apagar uno: lo incluido no se apaga mientras siga lo que lo incluye.
export const toggled = (chosen: readonly string[], id: string) =>
  chosen.includes(id) ? chosen.filter((one) => one !== id) : [...chosen, id];
