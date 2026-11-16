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
export function formatPesos(micro: bigint): string {
  const cents = centsOf(micro);
  const sign = cents < 0n ? '−' : '';
  const absolute = cents < 0n ? -cents : cents;
  const whole = (absolute / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decimals = (absolute % 100n).toString().padStart(2, '0');
  return `${sign}$ ${whole},${decimals}`;
}

// Pesos escritos como número (sin separadores) a millonésimos, sin pasar por la coma flotante.
export function microOf(pesos: string): bigint {
  const [whole = '0', fraction = ''] = pesos.split('.');
  return BigInt(whole) * microPerPeso + BigInt(fraction.padEnd(6, '0').slice(0, 6));
}
