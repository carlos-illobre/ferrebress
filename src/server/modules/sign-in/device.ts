// Cómo se llama un dispositivo y si es un celular, a partir de lo que dice su navegador (diseño de
// 01, § 5). El nombre sale de una lista cerrada: una computadora no puede hacerle mostrar al
// celular un texto que elija ella (revisión de seguridad, punto 4).
const browsers: [RegExp, string][] = [
  [/Edg\//, 'Edge'],
  [/Firefox\//, 'Firefox'],
  [/Chrome\//, 'Chrome'],
  [/Safari\//, 'Safari'],
];
const systems: [RegExp, string][] = [
  [/Android/, 'Android'],
  [/iPhone|iPad/, 'iPhone'],
  [/Windows/, 'Windows'],
  [/Mac OS X/, 'macOS'],
  [/Linux|CrOS/, 'Linux'],
];

const find = (list: [RegExp, string][], agent: string) =>
  list.find(([pattern]) => pattern.test(agent))?.[1];

export function deviceLabel(userAgent: string): string {
  const browser = find(browsers, userAgent);
  const system = find(systems, userAgent);
  return browser && system ? `${browser} en ${system}` : 'Otro navegador';
}

// Un celular según el navegador (Client Hints) o, donde no los manda, si es Android o iPhone.
export const isPhone = (userAgent: string, mobileHint: string | undefined): boolean =>
  mobileHint === '?1' || /Android|iPhone/.test(userAgent);
