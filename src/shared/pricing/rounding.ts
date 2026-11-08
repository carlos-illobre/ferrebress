// El redondeo del precio que calcula el sistema (06 · R3.1): siempre para arriba, al múltiplo
// siguiente del paso; un precio que ya es múltiplo queda igual, y con el paso 0 no se redondea. Lo
// usan el panel de Administración (los ejemplos) y el catálogo (07).

// Los precios se calculan en pesos con centavos: se cuenta en centavos para que 15.000 no pase a
// 16.000 por un error de la coma flotante.
export function roundUp(price: number, step: number): number {
  if (step === 0) return price;
  const cents = Math.round(price * 100);
  const stepCents = step * 100;
  return (Math.ceil(cents / stepCents) * stepCents) / 100;
}
