// Las pantallas que se abren desde Administración (06 · pantallas 1 a 3; 08 · pantalla 5): cada una
// en su dirección, adentro de la de Administración, así el menú la reconoce como suya y el espejo la
// lleva al otro dispositivo. Cuál está abierta sale de la dirección.
import { navigate, route } from '../../platform/router.ts';
import { useStore } from '../../platform/store.ts';

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
