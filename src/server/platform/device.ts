// El navegador y el sistema de un dispositivo, a partir de lo que dice su navegador (diseño de 01,
// § 5, y de 05, § 2.2). Salen de una lista cerrada, en códigos: una computadora no puede hacerle
// mostrar al celular un texto que elija ella (revisión de seguridad de 01, punto 4). Es lo que dice el
// navegador, no una prueba: cualquiera lo puede cambiar.
const browsers: [RegExp, string, string][] = [
  [/Edg\//, 'edge', 'Edge'],
  [/Firefox\//, 'firefox', 'Firefox'],
  [/Chrome\//, 'chrome', 'Chrome'],
  [/Safari\//, 'safari', 'Safari'],
];
const systems: [RegExp, string, string][] = [
  [/Android/, 'android', 'Android'],
  [/iPhone|iPad/, 'iphone', 'iPhone'],
  [/Windows/, 'windows', 'Windows'],
  [/Mac OS X/, 'macos', 'macOS'],
  [/Linux|CrOS/, 'linux', 'Linux'],
];

const find = (list: [RegExp, string, string][], agent = '') =>
  list.find(([pattern]) => pattern.test(agent));

export function deviceLabel(userAgent: string | undefined): string {
  const browser = find(browsers, userAgent);
  const system = find(systems, userAgent);
  return browser && system ? `${browser[2]} en ${system[2]}` : 'Otro navegador';
}

// Un celular según el navegador (Client Hints) o, donde no los manda, si es Android o iPhone.
export const isPhone = (userAgent: string | undefined, mobileHint: string | undefined): boolean =>
  mobileHint === '?1' || /Android|iPhone/.test(userAgent ?? '');

// Lo que se anota del dispositivo de un pedido: si es celular, y el navegador y el sistema que dice.
export function deviceCodes(header: (name: string) => string | undefined) {
  const agent = header('User-Agent');
  const browser = find(browsers, agent)?.[1];
  const os = find(systems, agent)?.[1];
  return {
    phone: isPhone(agent, header('Sec-CH-UA-Mobile')),
    ...(browser && { browser }),
    ...(os && { os }),
  };
}
