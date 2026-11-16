// El dibujo de un código QR (el camino de un SVG), para una dirección. El dibujante se baja una sola
// vez, recién cuando hace falta el primero.
import { useEffect, useState } from 'preact/hooks';

type Draw = typeof import('./qr-draw.ts')['qrPath'];
let drawing: Promise<Draw> | undefined;

export type QrDrawing = { size: number; d: string };

export function useQr(url: string | undefined): QrDrawing | undefined {
  const [draw, setDraw] = useState<{ qrPath: Draw }>(); // local: el dibujante, ya bajado
  useEffect(() => {
    drawing ??= import('./qr-draw.ts').then((loaded) => loaded.qrPath);
    void drawing.then((qrPath) => setDraw({ qrPath }));
  }, []);
  return url && draw ? draw.qrPath(url) : undefined;
}
