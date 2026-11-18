// El redondeo del precio que calcula el sistema (06 · R3.1): siempre para arriba, al múltiplo
// siguiente del paso; un precio que ya es múltiplo queda igual. En centavos enteros: «sin redondeo»
// es el paso de un centavo (R3.2), y así 15.000 no pasa a 16.000 por un error de la coma flotante. Lo
// usan el panel de Administración (los ejemplos) y el catálogo.
export function roundUp(cents: bigint, stepCents: number): bigint {
  const step = BigInt(stepCents);
  return ((cents + step - 1n) / step) * step;
}
