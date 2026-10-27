// El menú (00 · R1.1 y R1.2): las cinco partes en su orden, y las opciones de Más. Una opción sin
// pantalla todavía no existe: en pruebas dice «Pronto» y no se abre; en producción no aparece
// (R1.3). Cada módulo, cuando llegue, le pone su pantalla a la opción que le toca.
import type { IconName } from '../../ui/icon/Icon.tsx';

export type Option = {
  id: string;
  name: string;
  icon: IconName;
  // Alt más esta tecla la abre en la computadora (00 · R2.8).
  shortcut: string;
  path?: string;
  // En Más del celular: qué es, y el color del ícono (ámbar lo que avisa, neutro lo propio).
  detail?: string;
  tone?: 'urgent' | 'neutral';
};

export const parts: Option[] = [
  { id: 'sell', name: 'Vender', icon: 'shopping-cart', shortcut: 'v' },
  { id: 'catalog', name: 'Catálogo', icon: 'tags', shortcut: 'c' },
  { id: 'warehouse', name: 'Depósito', icon: 'package', shortcut: 'p' },
  { id: 'business', name: 'Negocio', icon: 'chart-column', shortcut: 'n' },
];

const business: Option[] = [
  {
    id: 'anomalies',
    name: 'Anomalías',
    icon: 'triangle-alert',
    shortcut: 'a',
    detail: 'Lo que no coincide',
    tone: 'urgent',
  },
  {
    id: 'processes',
    name: 'Procesos',
    icon: 'workflow',
    shortcut: 'r',
    detail: 'Cómo se trabaja, paso a paso',
  },
  {
    id: 'tickets',
    name: 'Mejoras y errores',
    icon: 'bug',
    shortcut: 'j',
    detail: 'Avisá algo que falla o una idea',
  },
];

const settings: Option[] = [
  {
    id: 'deviceSettings',
    name: 'Configuración',
    icon: 'settings',
    shortcut: 'g',
    detail: 'Lo tuyo, en este celular',
    tone: 'neutral',
  },
  {
    id: 'administration',
    name: 'Administración',
    icon: 'sliders-horizontal',
    shortcut: 't',
    detail: 'Ajustes para todos',
  },
  {
    id: 'manual',
    name: 'Manual',
    icon: 'book-open',
    shortcut: 'u',
    detail: 'Cómo se usa Ferrebress',
  },
];

export const moreOptions: Option[] = [...business, ...settings];

// Más en el celular las muestra en dos grupos.
export const moreGroups = [
  { title: 'Del negocio', options: business },
  { title: 'Ajustes', options: settings },
];

export const exists = (option: Option) => option.path !== undefined;

// Lo que se ve del menú: en pruebas, todo; en producción, solo lo que existe.
export const shown = (options: Option[], testing: boolean) =>
  testing ? options : options.filter(exists);
