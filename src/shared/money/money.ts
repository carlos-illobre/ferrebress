// La plata en millonésimos de peso (08 · R3.4): los costos se guardan así, sin errores de la coma
// flotante, y se muestran redondeados al centavo, la mitad para arriba ($ 1.648,725 se ve
// $ 1.648,73). Viajan como texto, porque un número de JavaScript no guarda bien los más grandes.
export const microPerPeso = 1_000_000n;

// Los centavos que se muestran.
export function centsOf(micro: bigint): bigint {
  const half = micro < 0n ? -5_000n : 5_000n;
  return (micro + half) / 10_000n;
}

// «$ 1.648,73»: con el punto de los miles y siempre dos decimales.
export const formatPesos = (micro: bigint): string => centsText(centsOf(micro));

// Pesos escritos como número (sin separadores) a millonésimos, sin pasar por la coma flotante.
export function microOf(pesos: string): bigint {
  const [whole = '0', fraction = ''] = pesos.split('.');
  return BigInt(whole) * microPerPeso + BigInt(fraction.padEnd(6, '0').slice(0, 6));
}

// Los centavos con su punto de miles: «1.648» y «73».
const parts = (cents: bigint) => {
  const absolute = cents < 0n ? -cents : cents;
  return {
    sign: cents < 0n ? '−' : '',
    whole: (absolute / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'),
    decimals: (absolute % 100n).toString().padStart(2, '0'),
  };
};

// Cuántos decimales muestra un precio con ese paso (06 · R3.6): con $ 1 o más, ninguno; con $ 0,10 o
// $ 0,50, uno; con $ 0,05 o sin redondeo, dos.
export const decimalsOf = (stepCents: number): 0 | 1 | 2 => {
  if (stepCents % 100 === 0) return 0;
  return stepCents % 10 === 0 ? 1 : 2;
};

// Un precio de venta en centavos, con los decimales del paso: «$ 16.000», «$ 1.201,4», «$ 10,15».
export function priceText(cents: bigint, stepCents: number): string {
  const { sign, whole, decimals } = parts(cents);
  const shown = decimals.slice(0, decimalsOf(stepCents));
  return `${sign}$ ${whole}${shown ? `,${shown}` : ''}`;
}

// Centavos, siempre con sus dos decimales: la cuenta de un precio (06 · R3.6).
export function centsText(cents: bigint): string {
  const { sign, whole, decimals } = parts(cents);
  return `${sign}$ ${whole},${decimals}`;
}

// Un paso del redondeo: «$ 0,05», «$ 0,10», «$ 1.000».
export const stepText = (stepCents: number): string =>
  stepCents % 100 === 0 ? priceText(BigInt(stepCents), stepCents) : centsText(BigInt(stepCents));
