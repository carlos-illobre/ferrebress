// Hasta cuándo se puede entrar sin conexión, como lo lee la persona (15 · R2.1).
const day = 24 * 60 * 60_000;

// «hoy 21:40», «mañana 9:40» o «el martes 9:40», en la hora del celular.
export function whenText(until: Date, now = new Date()): string {
  const time = `${until.getHours()}:${String(until.getMinutes()).padStart(2, '0')}`;
  const days = Math.round(
    (new Date(until).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / day,
  );
  if (days === 0) return `hoy ${time}`;
  if (days === 1) return `mañana ${time}`;
  return `el ${until.toLocaleDateString('es-AR', { weekday: 'long' })} ${time}`;
}
