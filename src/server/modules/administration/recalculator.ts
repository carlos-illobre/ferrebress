// Quien recalcula los precios cuando cambia el redondeo (06 · R3.4, R3.5; diseño de 06, § 1): el
// catálogo se lo pasa a Administración al crearse. Sin precios, no cambia ninguno y el redondeo se
// guarda sin preguntar (E21).
import type { RoundingResponse } from '@ferrebress/shared/contracts/administration';

export type PriceRecalculator = {
  // Lo que muestra el panel: cuántos hay, cuántos cambian con cada paso y unos ejemplos, de verdad
  // solo para quien ve los costos (R3.7).
  preview(seesCosts: boolean): Promise<RoundingResponse>;
  // Cuántos precios cambian con ese paso.
  changesWith(step: number): Promise<number>;
  // Los recalcula con ese paso dentro de la transacción del cambio: si falla, no cambia nada.
  apply(step: number, trx: unknown): Promise<number>;
};
