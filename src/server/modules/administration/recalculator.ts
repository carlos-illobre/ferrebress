// Quien recalcula los precios cuando cambia el redondeo (06 · R3.4, R3.5; diseño de 06, § 1): el
// catálogo (07) se lo pasa a Administración al crearse. Hasta que exista no hay precios: no cambia
// ninguno y el redondeo se guarda sin preguntar (E21).
import type { RoundingResponse } from '@ferrebress/shared/contracts/administration';

export type PriceRecalculator = {
  // Lo que muestra el panel: cuántos hay, cuántos cambian con cada paso y unos ejemplos.
  preview(): Promise<RoundingResponse>;
  // Cuántos precios cambian con ese paso.
  changesWith(step: number): Promise<number>;
  // Los recalcula con ese paso dentro de la transacción del cambio: si falla, no cambia nada.
  apply(step: number, trx: unknown): Promise<number>;
};

export const noPrices: PriceRecalculator = {
  preview: async () => ({ total: 0, changes: {}, examples: [] }),
  changesWith: async () => 0,
  apply: async () => 0,
};
