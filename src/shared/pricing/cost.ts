// La cuenta del costo (08 · R3.3, R3.4): el precio de lista de una unidad; si incluía IVA, sin el IVA
// que dice la lista o el de arranque del proveedor; y cada descuento que le toca, uno sobre el
// resultado del anterior, en orden. En millonésimos de peso y con BigInt: cortado al millonésimo, sin
// redondeo que se vea (se muestra al centavo, src/shared/money). Devuelve el costo y cada paso, para
// mostrar la cuenta. La usan el servidor (al leer, aplicar y recalcular) y la aplicación.

// Un descuento de cómo cobra un proveedor (R3.2): `percent` en centésimos de por ciento (2,5 % es
// 250), de 1 a 9.999; `brand`, la marca como searchKey, o null si vale para todas.
export type Discount = { id: string; name: string; percent: number; brand: string | null };

export type CostInput = {
  listPrice: bigint;
  vatIncluded: boolean;
  // El IVA a quitar, en décimos (21 % es 210): el de la lista o el de arranque del proveedor.
  vat: number;
  discounts: readonly Pick<Discount, 'name' | 'percent'>[];
};

export type CostStep =
  | { kind: 'list'; amount: bigint }
  | { kind: 'vat'; vat: number; amount: bigint }
  | { kind: 'discount'; name: string; percent: number; amount: bigint };

// Los descuentos que le tocan a un producto de esa marca (E19: sin distinguir mayúsculas).
export const discountsFor = (discounts: readonly Discount[], brandKey: string | null) =>
  discounts.filter((discount) => discount.brand === null || discount.brand === brandKey);

export function costOf(input: CostInput): { cost: bigint; steps: CostStep[] } {
  const steps: CostStep[] = [{ kind: 'list', amount: input.listPrice }];
  let amount = input.listPrice;
  if (input.vatIncluded) {
    amount = (amount * 1000n) / BigInt(1000 + input.vat);
    steps.push({ kind: 'vat', vat: input.vat, amount });
  }
  for (const { name, percent } of input.discounts) {
    amount = (amount * BigInt(10_000 - percent)) / 10_000n;
    steps.push({ kind: 'discount', name, percent, amount });
  }
  return { cost: amount, steps };
}
