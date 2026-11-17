// Las pantallas que se abren desde Administración (06 · pantallas 1 a 3; 08 · pantalla 5): cada una
// en su dirección, adentro de la de Administración, así el menú la reconoce como suya y el espejo la
// lleva al otro dispositivo. Cuál está abierta sale de la dirección.
import { can } from '@ferrebress/shared/contracts/can';
import { navigate, route } from '../../platform/router.ts';
import { useStore } from '../../platform/store.ts';
import { person as me } from '../sign-in/index.ts';

export type AdminPage = 'settings' | 'readers' | 'files';

export const adminPaths: Record<AdminPage, string> = {
  settings: '/administration',
  readers: '/administration/readers',
  files: '/administration/files',
};

export const pageOf = (path: string): AdminPage =>
  (Object.keys(adminPaths) as AdminPage[]).find(
    (page) => page !== 'settings' && path.startsWith(adminPaths[page]),
  ) ?? 'settings';

export const useAdminPage = (): AdminPage => pageOf(useStore(route).path);

export const openAdminPage = (page: AdminPage) => navigate(adminPaths[page]);

// Las que se ofrecen desde Administración: Archivos de listas, solo con «Ver costos» (06 · R10.3).
export function useAdminLinks(): Exclude<AdminPage, 'settings'>[] {
  const who = useStore(me);
  return who && can(who, 'price-lists.costs') ? ['readers', 'files'] : ['readers'];
}
