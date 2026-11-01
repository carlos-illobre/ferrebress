// Lo que no se puede guardar, dicho junto a lo que se estaba armando (un rol, los roles de alguien).
import { Icon } from '../../../../ui/icon/Icon.tsx';

export function Problem({ text }: { text: string | undefined }) {
  if (!text) return null;
  return (
    <p class="users-field-error" role="alert">
      <Icon name="triangle-alert" size="small" />
      {text}
    </p>
  );
}
