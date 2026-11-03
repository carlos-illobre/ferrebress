// Los días del negocio (00 · R8.4): la zona horaria del negocio y cómo se pasa de un instante a su día
// y de un día a sus instantes. La usan el servidor y la aplicación. Hasta que el módulo 06 deje
// elegir la zona, es la de Buenos Aires, en este solo lugar.
export const businessTimeZone = 'America/Argentina/Buenos_Aires';

// Un día del negocio, `AAAA-MM-DD`.
export type BusinessDate = string;

const dateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: businessTimeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const partsFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: businessTimeZone,
  hourCycle: 'h23',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
});

const dayMs = 24 * 60 * 60 * 1000;

export function isBusinessDate(text: string): boolean {
  const parsed = Date.parse(`${text}T00:00:00Z`);
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(text) &&
    !Number.isNaN(parsed) &&
    new Date(parsed).toISOString().startsWith(text)
  );
}

// El día del negocio de un instante.
export const businessDateOf = (instant: Date): BusinessDate => dateFormat.format(instant);

// El primer instante de un día del negocio.
export function startOfBusinessDate(date: BusinessDate): Date {
  const guess = Date.parse(`${date}T00:00:00Z`);
  const first = guess - offsetAt(guess);
  // Con un cambio de hora en el medio, la diferencia de ese momento es otra: se corrige una vez.
  return new Date(guess - offsetAt(first));
}

// Cuánto adelanta (o atrasa) la hora del negocio respecto de la de Greenwich en ese instante.
function offsetAt(instant: number): number {
  const parts = partsFormat.formatToParts(new Date(instant));
  const n = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((one) => one.type === type)?.value);
  const wall = Date.UTC(n('year'), n('month') - 1, n('day'), n('hour'), n('minute'), n('second'));
  return wall - Math.floor(instant / 1000) * 1000;
}

export const addDays = (date: BusinessDate, days: number): BusinessDate =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * dayMs).toISOString().slice(0, 10);

// El lunes de la semana de ese día y el primero de su mes.
export function mondayOf(date: BusinessDate): BusinessDate {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  return addDays(date, -((weekday + 6) % 7));
}
export const firstOfMonth = (date: BusinessDate): BusinessDate => `${date.slice(0, 8)}01`;
