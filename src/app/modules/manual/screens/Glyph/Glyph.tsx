// Un ícono del manual (icons.ts), dibujado con Preact desde sus datos: del color del texto y
// decorativo, como los de ui/icon. Uno que no está no dibuja nada (el lector ya lo rechaza).
import { h } from 'preact';
import '../../../../ui/icon/icon.css';
import { manualIcons } from '../../icons.ts';

export function Glyph({ name, size }: { name: string; size?: 'small' | 'large' | 'huge' }) {
  return (
    <svg
      class={size ? `icon icon-${size}` : 'icon'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width={2}
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      {(manualIcons[name] ?? []).map(([tag, attributes], at) => h(tag, { key: at, ...attributes }))}
    </svg>
  );
}
