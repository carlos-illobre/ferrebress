// El menú (00 · R1.1 y R1.2): las cinco partes en su orden, y las opciones de Más. Una opción sin
// pantalla todavía no existe: dice «Pronto» y no se abre, en pruebas y en producción (R1.3). Cada
// módulo, cuando llegue, le pone su pantalla a la opción que le toca.
import { can } from '@ferrebress/shared/contracts/can';
import type { PermissionId } from '@ferrebress/shared/contracts/permissions';
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
  // El permiso que pide: sin él, no aparece (R1.8, 02 · R7.7).
  permission?: PermissionId;
  // Lo de adentro que pide su propio permiso, con su dirección (Quién hizo qué, en Usuarios).
  inside?: Option[];
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
    permission: 'users.view',
    inside: [
      {
        id: 'audit-log',
        name: 'Quién hizo qué',
        icon: 'file-text',
        shortcut: '',
        path: '/users/audit-log',
        permission: 'audit-log.view',
      },
    ],
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

type Who = { permissions: readonly string[] };

// Lo que la persona puede usar (R1.8): lo que no pide permiso, o aquello cuyo permiso tiene.
export const allowed = (option: Option, person: Who) =>
  !option.permission || can(person, option.permission);

// El menú y Más de la persona, sin lo que no puede usar.
export const partsFor = (person: Who) => parts.filter((option) => allowed(option, person));
export const moreFor = (person: Who) => moreOptions.filter((option) => allowed(option, person));

// Ir a la primera opción que sí puede usar (R1.4, 02 · R7.7). Lo impone el marco (también «Ya no
// tenés permiso», 02 · R7.8): no pregunta por lo que no se guardó.
export const goToFirst = (person: Who) =>
  navigate(firstOption(person).path ?? '/', { replace: true, force: true });

// La primera opción del menú que existe y que la persona puede usar (R1.4); sin ninguna, Vender.
export const firstOption = (person: Who): Option =>
  [...parts, ...moreOptions].find(
    (option) => exists(option) && !option.over && allowed(option, person),
  ) ?? (parts[0] as Option);

export const unavailable = (option: Option, online: boolean) => !!option.needsInternet && !online;

// Abre una opción y guarda de dónde se viene (la parte abierta, o Más), para que «Volver» vuelva ahí
// (el manual, 00 · R6.7).
export const openOption = (option: Option, from: string, replace = false) =>
  option.path && navigate(option.path, { state: { from }, replace });

// La opción de una dirección: la que la tiene como suya, también con algo más adentro (/users/roles
// es de Usuarios, 02 · R7.13). El manual no cuenta: se abre encima de la pantalla, que sigue debajo
// (R1.4).
const under = (path: string, own: string) => path === own || path.startsWith(`${own}/`);
export const optionAt = (path: string) =>
  [...parts, ...moreOptions].find(
    (option) => option.path !== undefined && under(path, option.path) && !option.over,
  );

// Si es una dirección del menú (o de algo adentro de una opción, o el inicio): lo que puede llegar del
// otro dispositivo por el espejo (diseño de 03, § 5.4).
export const isMenuPath = (path: string) =>
  path === '/' ||
  [...parts, ...moreOptions].some(
    (option) =>
      (option.path !== undefined && under(path, option.path)) ||
      option.inside?.some((inner) => inner.path !== undefined && under(path, inner.path)),
  );

// Lo de adentro de una opción que tiene esa dirección (05 · E13).
export const insideAt = (option: Option | undefined, path: string) =>
  option?.inside?.find((inner) => inner.path !== undefined && under(path, inner.path));
