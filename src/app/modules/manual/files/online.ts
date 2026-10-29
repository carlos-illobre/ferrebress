// Cuántas veces volvió la conexión desde que se abrió el manual: lo que no llegó por falta de red (un
// capítulo, una captura) se pide de nuevo al volver (R4.6; anotado en docs/technical/mobile-data.md).
import { useEffect, useState } from 'preact/hooks';

export function useOnline(): number {
  const [times, setTimes] = useState(0);
  useEffect(() => {
    const again = () => setTimes((count) => count + 1);
    addEventListener('online', again);
    return () => removeEventListener('online', again);
  }, []);
  return times;
}
