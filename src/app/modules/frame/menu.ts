// El menú (00 · R1.1 y R1.2): las cinco partes en su orden, y las opciones de Más. Una opción sin
// pantalla todavía no existe: en pruebas dice «Pronto» y no se abre; en producción no aparece
// (R1.3). Cada módulo, cuando llegue, le pone su pantalla a la opción que le toca.
import { navigate } from '../../platform/router.ts';
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
  // Lo que sin conexión no puede andar: se pone gris y dice «Sin conexión» (R4.4).
  needsInternet?: boolean;
  // Se abre encima de todo y no es una pantalla de trabajo (el manual): al entrar no se abre (R1.4).
  over?: boolean;
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
    id: 'users',
    name: 'Usuarios',
    icon: 'users',
    shortcut: 's',
    detail: 'Quién entra y desde dónde',
    path: '/users',
    needsInternet: true,
  },
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
    path: '/manual',
    needsInternet: true,
    over: true,
  },
];

// Más, en el mismo orden en la computadora y en el celular, sin grupos (00 · R1.2).
export const moreOptions: Option[] = [...business, ...settings];

export const exists = (option: Option) => option.path !== undefined;

export const unavailable = (option: Option, online: boolean) => !!option.needsInternet && !online;

// Abre una opción y guarda de dónde se viene (la parte abierta, o Más), para que «Volver» vuelva ahí
// (el manual, 00 · R6.7).
export const openOption = (option: Option, from = 'app', replace = false) =>
  option.path && navigate(option.path, { state: { from }, replace });

// La opción de una dirección: la que la tiene como suya.
// El manual no cuenta: se abre encima de la pantalla, que sigue debajo (R1.4).
export const optionAt = (path: string) =>
  [...parts, ...moreOptions].find((option) => option.path === path && !option.over);

// Lo que se ve del menú: en pruebas, todo; en producción, solo lo que existe.
export const shown = (options: Option[], testing: boolean) =>
  testing ? options : options.filter(exists);
