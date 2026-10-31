// Un ícono de Lucide (docs/design/visual-language.md), del color del texto que acompaña. Están
// dibujados en la aplicación, sin bajar nada, y solo los que usa alguna pantalla.
import './icon.css';
import type { VNode } from 'preact';
import { menuShapes } from './menu-shapes.tsx';
import type { peopleShapes } from './people-shapes.tsx';
import { shapes } from './shapes.tsx';

const all: Record<string, VNode> = { ...shapes, ...menuShapes };

export type IconName = keyof typeof shapes | keyof typeof menuShapes | keyof typeof peopleShapes;

// Los íconos de una pantalla que se baja a pedido llegan con ella.
export function addShapes(more: Record<string, VNode>): void {
  Object.assign(all, more);
}

// Decorativo: lo que significa lo dice el texto de al lado, así que el lector de pantalla lo saltea.
// stroke: el trazo, si la maqueta lo pide más fino que el de siempre.
export function Icon({
  name,
  size,
  stroke = 2,
}: {
  name: IconName;
  size?: 'small' | 'large' | 'huge';
  stroke?: number;
}) {
  return (
    <svg
      class={size ? `icon icon-${size}` : 'icon'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width={stroke}
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      {all[name]}
    </svg>
  );
}
