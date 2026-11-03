// Si la pantalla es angosta (el corte de las maquetas, 900 px), al día con la ventana: al girar el
// celular o achicar la ventana, la pantalla se vuelve a dibujar.
import { useEffect, useState } from 'preact/hooks';

export const narrowQuery = '(max-width: 899px)';

export const isNarrow = () => matchMedia(narrowQuery).matches;
// La computadora: 900 px o más.
export const isWide = () => matchMedia('(min-width: 900px)').matches;

export function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(isNarrow);
  useEffect(() => {
    const media = matchMedia(narrowQuery);
    const change = () => setNarrow(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  return narrow;
}
