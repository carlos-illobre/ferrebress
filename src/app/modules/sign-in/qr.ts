// El código QR de la computadora, dibujado como un solo trazo de SVG con qrcode-generator. Lleva
// la dirección /link#<código>: lo que va después del # no llega al servidor ni a sus registros, y
// la cámara del celular abre la aplicación directo ahí (diseño de 01, § 5).
import qrcode from 'qrcode-generator';

export const linkPath = '/link';

export const linkUrl = (code: string) => `${location.origin}${linkPath}#${code}`;

// Corrección alta: el isotipo tapa el centro.
export function qrPath(text: string): { size: number; d: string } {
  const qr = qrcode(0, 'H');
  qr.addData(text);
  qr.make();
  const size = qr.getModuleCount();
  let d = '';
  for (let row = 0; row < size; row += 1)
    for (let col = 0; col < size; col += 1) if (qr.isDark(row, col)) d += `M${col} ${row}h1v1h-1z`;
  return { size, d };
}

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
