// Cuántas cosas esperan en una opción de Más (las anomalías abiertas, 06 · R9.5): el número que se ve
// en la opción y en Más. Lo pone el módulo de cada opción, sin que el marco sepa de dónde sale; sin
// nada, no hay número.
import { createStore, useStore } from '../../platform/store.ts';
import { moreOptions } from './menu.ts';

const counts = createStore<Readonly<Record<string, number>>>({});

export const setMenuCount = (id: string, count: number) =>
  counts.set({ ...counts.get(), [id]: Math.max(0, count) });

export const useMenuCount = (id: string): number => useStore(counts)[id] ?? 0;

// En Más, la suma de lo que esperan sus opciones.
export function useMoreCount(): number {
  const now = useStore(counts);
  return moreOptions.reduce((sum, option) => sum + (now[option.id] ?? 0), 0);
}
