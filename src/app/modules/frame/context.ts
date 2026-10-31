// Lo que comparten las piezas del marco: quién entró, si es el ambiente de pruebas, la conexión, lo
// abierto, el menú minimizado y los globos. Lo arma Frame una vez; las piezas lo leen con useFrame.
import type { Person } from '@ferrebress/shared/contracts/sign-in';
import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import type { useCollapse } from './behavior/useCollapse.ts';
import type { usePanels } from './behavior/usePanels.ts';
import type { usePhoneMore } from './behavior/usePhoneMore.ts';
import type { useTip } from './behavior/useTip.ts';

export type FrameState = {
  person: Person;
  testing: boolean;
  online: boolean;
  current: string;
  collapse: ReturnType<typeof useCollapse>;
  panels: ReturnType<typeof usePanels>;
  phoneMore: ReturnType<typeof usePhoneMore>;
  tip: ReturnType<typeof useTip>;
  // Lo que todavía no está, al tocarlo: se sacude y lo dice (R1.3).
  notYet: (element: HTMLElement, name: string) => void;
  signOut: () => unknown;
  // Un interruptor de otro módulo para Más del celular, debajo de Configuración: hoy, «Trabajar sin
  // conexión» (15 · R1). El marco solo lo muestra.
  setting: SettingRow | undefined;
};

export type SettingRow = { name: string; detail: string; on: boolean; toggle: () => void };

export const FrameContext = createContext<FrameState | undefined>(undefined);

export const useFrame = () => useContext(FrameContext) as FrameState;

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');

// La sacudida de lo que no está: se saca la clase y se vuelve a poner para que arranque de nuevo.
export function shake(element: Element): void {
  element.classList.remove('not-here');
  void (element as HTMLElement).offsetWidth;
  element.classList.add('not-here');
}
