// Un ícono de Lucide (docs/design/visual-language.md), del color del texto que acompaña. Están
// dibujados en la aplicación, sin bajar nada, y solo los que usa alguna pantalla.
import './icon.css';
import { menuShapes } from './menu-shapes.tsx';
import { shapes } from './shapes.tsx';

const all = { ...shapes, ...menuShapes };

export type IconName = keyof typeof all;

// Decorativo: lo que significa lo dice el texto de al lado, así que el lector de pantalla lo saltea.
export function Icon({ name, size }: { name: IconName; size?: 'small' | 'large' | 'huge' }) {
  return (
    <svg
      class={size ? `icon icon-${size}` : 'icon'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      {all[name]}
    </svg>
  );
}
