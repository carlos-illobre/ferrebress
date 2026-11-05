// El código QR de la computadora lleva la dirección /link#<código>: lo que va después del # no llega
// al servidor ni a sus registros, y la cámara del celular abre la aplicación directo ahí (diseño de
// 01, § 5). Se dibuja con platform/camera/qr-draw.ts, que se baja recién cuando se muestra.

export const linkPath = '/link';

export const linkUrl = (code: string) => `${location.origin}${linkPath}#${code}`;

// Lo que leyó la cámara, si es un código de esta aplicación.
export function codeOf(text: string): string | undefined {
  try {
    const url = new URL(text);
    if (url.origin !== location.origin || url.pathname !== linkPath) return undefined;
    return url.hash.slice(1) || undefined;
  } catch {
    return undefined;
  }
}
