// Lo que no se puede guardar, dicho junto a lo que se estaba armando (un rol, los roles de alguien):
// en rojo suave, con su ícono.
import { Icon } from '../../../../ui/icon/Icon.tsx';
import './Problem.css';

export function Problem({ text }: { text: string | undefined }) {
  if (!text) return null;
  return (
    <p class="users-problem" role="alert">
      <Icon name="triangle-alert" size="small" />
      <span>{text}</span>
    </p>
  );
}
