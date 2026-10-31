// El QR dibujado como un solo trazo de SVG con qrcode-generator (unos 20 KB): se baja recién cuando
// la entrada de la computadora lo muestra, así el arranque no lo trae (diseño de 01, § 10).
import qrcode from 'qrcode-generator';

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
