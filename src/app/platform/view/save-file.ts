// Guardar en el dispositivo un archivo que ya se bajó: el navegador lo guarda con su nombre, como un
// enlace de descarga, y la dirección temporal se suelta enseguida.
export function saveFile(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.rel = 'noopener';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
