// Las pantallas que se abren desde Administración (06 · pantallas 1 a 3; 08 · pantalla 5): cada una
// en su dirección, adentro de la de Administración, así el menú la reconoce como suya y el espejo la
// lleva al otro dispositivo. Cuál está abierta sale de la dirección.
import { can } from '@ferrebress/shared/contracts/can';
import type { PermissionId } from '@ferrebress/shared/contracts/permissions';
import { navigate, route } from '../../platform/router.ts';
import { useStore } from '../../platform/store.ts';
import { person as me } from '../sign-in/index.ts';

export type AdminPage = 'settings' | 'anomalies' | 'readers' | 'files';

export const adminPaths: Record<AdminPage, string> = {
  settings: '/administration',
  // Anomalías es además su propia opción de Más (06 · R9.5): el marco la abre por su dirección.
  anomalies: '/administration/anomalies',
  readers: '/administration/readers',
  files: '/administration/files',
};

export const pageOf = (path: string): AdminPage =>
  (Object.keys(adminPaths) as AdminPage[]).find(
    (page) => page !== 'settings' && path.startsWith(adminPaths[page]),
  ) ?? 'settings';

export const useAdminPage = (): AdminPage => pageOf(useStore(route).path);

export const openAdminPage = (page: AdminPage) => navigate(adminPaths[page]);

// Las que se ofrecen desde Administración: Anomalías, con «Revisar las anomalías» (R9.3); Archivos de
// listas, con «Ver costos» (R10.3).
export function useAdminLinks(): Exclude<AdminPage, 'settings'>[] {
  const who = useStore(me);
  const may = (id: PermissionId) => !!who && can(who, id);
  return [
    ...(may('anomalies.review') ? (['anomalies'] as const) : []),
    'readers',
    ...(may('price-lists.costs') ? (['files'] as const) : []),
  ];
}
