// Las pantallas de Catálogo que son de las listas de precios (08 · pantallas 1 y 3): cada una en su
// dirección, así el menú la reconoce como de Catálogo y el espejo la lleva al otro dispositivo. Cuál
// está abierta sale de la dirección.
import { navigate, route } from '../../platform/router.ts';
import { useStore } from '../../platform/store.ts';

export type CatalogPage = { page: 'suppliers' } | { page: 'review'; listId: string };

const reviewPath = /^\/catalog\/lists\/([0-9a-f-]{36})$/;

export function pageOf(path: string): CatalogPage {
  const listId = path.match(reviewPath)?.[1];
  return listId ? { page: 'review', listId } : { page: 'suppliers' };
}

export const useCatalogPage = (): CatalogPage => pageOf(useStore(route).path);

export const openReview = (listId: string) => navigate(`/catalog/lists/${listId}`);
export const openSuppliers = () => navigate('/catalog');
