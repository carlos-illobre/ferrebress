// Elegir los roles de una persona (R7.5; maqueta users-person-roles, variante 1): cada rol con su
// descripción, tildado si lo tiene, y su número, que lo tilda con el teclado si el cursor está en
// la lista. Lo usan autorizar y la tarjeta. No guarda nada: avisa el conjunto nuevo.
import { Icon } from '../../ui/icon/Icon.tsx';
import './RolePicker.css';

type Pick = { id: string; name: string; description: string | null; on: boolean };

export function RolePicker({
  picks,
  toggle,
  label,
}: {
  picks: readonly Pick[];
  toggle: (id: string) => void;
  label: string;
}) {
  return (
    // Con el cursor en la lista, su número lo tilda o lo destilda (00 · R2): lo hace la navegación
    // del teclado con data-letters.
    <fieldset class="role-picker" data-letters="">
      <legend class="visually-hidden">{label}</legend>
      {picks.map((role, index) => (
        <label key={role.id} class={role.on ? 'role-pick on' : 'role-pick'}>
          <input
            type="checkbox"
            checked={role.on}
            {...(index < 9 && { 'data-key': String(index + 1) })}
            onChange={() => toggle(role.id)}
          />
          <span class="role-pick-box" aria-hidden="true">
            {role.on && <Icon name="check" size="small" />}
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
