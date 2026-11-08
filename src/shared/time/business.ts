// Los días del negocio (00 · R8.4, 06 · R5): la zona horaria del negocio y cómo se pasa de un instante
// a su día y de un día a sus instantes. La usan el servidor y la aplicación. La zona se fija al
// instalar: el servidor la lee del .env al arrancar y la aplicación la recibe en /api/start (diseño
// de 06, § 5). Hasta que alguien la fija, vale la del sistema.

// Un día del negocio, `AAAA-MM-DD`.
export type BusinessDate = string;

let zone: string | undefined;
let final = false;
let formats: { date: Intl.DateTimeFormat; parts: Intl.DateTimeFormat } | undefined;

// Una zona horaria que el sistema conoce. Se prueba armando un formato con ella: la lista de
// `Intl.supportedValuesOf('timeZone')` no trae todos los nombres que acepta, como
// `America/Argentina/Buenos_Aires` (diseño de 06, § 5).
export function isTimeZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

export const businessTimeZone = (): string =>
  zone ?? new Intl.DateTimeFormat().resolvedOptions().timeZone;

// Fija la zona. El servidor la fija una sola vez (`final`): otra vez es un error, así nada la cambia
// con el servidor andando. La aplicación la vuelve a fijar con cada /api/start.
export function setBusinessTimeZone(next: string, options: { final?: boolean } = {}): void {
  if (final) throw new Error('La zona horaria del negocio ya está fijada');
  zone = next;
  final = options.final === true;
  formats = undefined;
  made.clear();
}

// Un formato en la zona del negocio, armado una vez por forma y por zona: armarlo es caro y una
// lista escribe muchas fechas.
const made = new Map<string, Intl.DateTimeFormat>();
export function businessFormat(
  locale: string,
  options: Omit<Intl.DateTimeFormatOptions, 'timeZone'>,
): Intl.DateTimeFormat {
  const key = `${locale}${JSON.stringify(options)}`;
  let found = made.get(key);
  if (!found) {
    found = new Intl.DateTimeFormat(locale, { ...options, timeZone: businessTimeZone() });
    made.set(key, found);
  }
  return found;
}

// Los formatos se arman la primera vez que se usan, con la zona de ese momento.
function formatsNow() {
  formats ??= {
    date: new Intl.DateTimeFormat('en-CA', {
      timeZone: businessTimeZone(),
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }),
    parts: new Intl.DateTimeFormat('en-US', {
      timeZone: businessTimeZone(),
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    }),
  };
  return formats;
}

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
export const businessDateOf = (instant: Date): BusinessDate => formatsNow().date.format(instant);

// El primer instante de un día del negocio.
export function startOfBusinessDate(date: BusinessDate): Date {
  const guess = Date.parse(`${date}T00:00:00Z`);
  const first = guess - offsetAt(guess);
  // Con un cambio de hora en el medio, la diferencia de ese momento es otra: se corrige una vez.
  return new Date(guess - offsetAt(first));
}

// Cuánto adelanta (o atrasa) la hora del negocio respecto de la de Greenwich en ese instante.
function offsetAt(instant: number): number {
  const parts = formatsNow().parts.formatToParts(new Date(instant));
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
