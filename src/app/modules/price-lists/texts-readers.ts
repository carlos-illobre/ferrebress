// Los textos de Lectores (08 · pantalla 5, R5.8): largos en la computadora, que explican, y cortos en
// el celular, que dicen lo mismo (00 · R1.5).
import type { ReaderOrigin } from '@ferrebress/shared/contracts/price-lists';

export const readersTexts = {
  title: 'Lectores',
  parent: 'Administración',
  about: {
    long: 'Cada lector entiende un formato de planilla de un proveedor. Uno que lee mal se desactiva: no se usa desde la planilla siguiente.',
    short: 'Uno que lee mal se desactiva.',
  },
  search: { long: 'Buscar por proveedor', short: 'Buscar proveedor' },
  noSupplier: 'Sin proveedor todavía',
  origins: {
    programmer: 'Escrito por un programador',
    auto: 'Automático',
    ai: 'Generado por IA',
  } satisfies Record<ReaderOrigin, string>,
  since: (date: string) => `Desde el ${date}`,
  lastList: (name: string, date?: string) => `Leyó ${name}${date ? ` (lista del ${date})` : ''}`,
  noList: 'Todavía no leyó ninguna lista',
  active: 'Activo',
  inactive: 'Desactivado',
  deactivate: 'Desactivar',
  activate: 'Activar',
  deactivated: (origin: string) => `${origin}: desactivado`,
  activated: (origin: string) => `${origin}: activado`,
  undo: 'Deshacer',
  failed: 'No se pudo cambiar. Probá de nuevo.',
  noPermission: 'Para activar o desactivar un lector hace falta «Cambiar los ajustes».',
  empty: {
    long: 'Todavía no hay lectores: se crean solos al leer la primera lista de cada proveedor.',
    short: 'Todavía no hay lectores.',
  },
  noMatch: 'Ningún proveedor con ese nombre.',
  loading: 'Cargando los lectores…',
  loadFailed: 'No se pudieron traer los lectores.',
  retry: 'Reintentar',
  offline: (at: string) => ({
    long: `Sin conexión: es lo último que se vio, a las ${at}. Con conexión se puede cambiar.`,
    short: `Sin conexión · ${at}`,
  }),
};
