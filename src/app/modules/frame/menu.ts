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
};

export const parts: Option[] = [
  { id: 'sell', name: 'Vender', icon: 'shopping-cart', shortcut: 'v' },
  { id: 'catalog', name: 'Catálogo', icon: 'tags', shortcut: 'c' },
  { id: 'warehouse', name: 'Depósito', icon: 'package', shortcut: 'p' },
  { id: 'business', name: 'Negocio', icon: 'chart-column', shortcut: 'n' },
];

export const moreOptions: Option[] = [
  { id: 'anomalies', name: 'Anomalías', icon: 'triangle-alert', shortcut: 'a' },
  { id: 'processes', name: 'Procesos', icon: 'workflow', shortcut: 'r' },
  { id: 'tickets', name: 'Mejoras y errores', icon: 'bug', shortcut: 'j' },
  { id: 'deviceSettings', name: 'Configuración', icon: 'settings', shortcut: 'g' },
  { id: 'administration', name: 'Administración', icon: 'sliders-horizontal', shortcut: 't' },
  { id: 'manual', name: 'Manual', icon: 'book-open', shortcut: 'u' },
];

export const exists = (option: Option) => option.path !== undefined;

// Lo que se ve del menú: en pruebas, todo; en producción, solo lo que existe.
export const shown = (options: Option[], testing: boolean) =>
  testing ? options : options.filter(exists);
