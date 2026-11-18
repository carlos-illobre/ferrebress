// El precio de venta (07 · R2.2): costo × (1 + margen) × (1 + IVA), con el margen sobre el costo sin
// IVA, llevado para arriba al centavo, y después redondeado para arriba al múltiplo del paso de
// Administración (06 · R3.1). En centavos y con BigInt, sin errores de la coma flotante. Lo usan el
// servidor (al guardar el precio) y la aplicación (al mostrar «Así se calcula»).
import { roundUp } from './rounding.ts';

const microPerCent = 10_000n;

// a / b, para arriba (a y b positivos o cero).
const ceilDiv = (a: bigint, b: bigint) => (a + b - 1n) / b;

export type SaleSteps = {
  // El costo, en millonésimos.
  cost: bigint;
  // Con el margen, en centavos, llevado para arriba.
  withMargin: bigint;
  // Con el IVA: el precio sin redondear, en centavos, llevado para arriba.
  raw: bigint;
  // El paso y el precio redondeado, en centavos.
  stepCents: number;
  sale: bigint;
};

// El precio sin redondear, en centavos: la cuenta entera en una división, así no se suma un centavo
// por cada paso. `margin` en por ciento entero; `vat` en décimos (21 % es 210).
export const rawCents = (costMicro: bigint, margin: number, vat: number): bigint =>
  ceilDiv(costMicro * BigInt(100 + margin) * BigInt(1000 + vat), 100n * 1000n * microPerCent);

// El precio y su cuenta, paso a paso (R2.6).
export function salePrice(
  costMicro: bigint,
  margin: number,
  vat: number,
  stepCents: number,
): SaleSteps {
  const raw = rawCents(costMicro, margin, vat);
  return {
    cost: costMicro,
    withMargin: ceilDiv(costMicro * BigInt(100 + margin), 100n * microPerCent),
    raw,
    stepCents,
    sale: roundUp(raw, stepCents),
  };
}
