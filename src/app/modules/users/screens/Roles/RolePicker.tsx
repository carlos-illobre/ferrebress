// Elegir los roles de una persona (R7.5; maqueta users-person-roles, variante 1): cada rol con su
// descripción, tildado si lo tiene, y su número, que lo tilda con el teclado. Lo usan autorizar y la
// tarjeta. No guarda nada: avisa el conjunto nuevo.
import type { RoleSummary } from '@ferrebress/shared/contracts/roles';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import './RolePicker.css';

export function RolePicker({
  roles,
  chosen,
  onChange,
  label,
}: {
  roles: RoleSummary[];
  chosen: string[];
  onChange: (next: string[]) => void;
  label: string;
}) {
  const toggle = (id: string) =>
    onChange(chosen.includes(id) ? chosen.filter((one) => one !== id) : [...chosen, id]);
  return (
    <fieldset class="role-picker">
      <legend class="visually-hidden">{label}</legend>
      {roles.map((role, index) => (
        <label key={role.id} class={chosen.includes(role.id) ? 'role-pick on' : 'role-pick'}>
          <input
            type="checkbox"
            checked={chosen.includes(role.id)}
            onChange={() => toggle(role.id)}
          />
          <span class="role-pick-box" aria-hidden="true">
            {chosen.includes(role.id) && <Icon name="check" size="small" />}
          </span>
          <span class="role-pick-text">
            <b>{role.name}</b>
            {role.description && <small>{role.description}</small>}
          </span>
          {index < 9 && <kbd>{index + 1}</kbd>}
        </label>
      ))}
    </fieldset>
  );
}
