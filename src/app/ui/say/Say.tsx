// Un texto con sus dos formas (platform/view/words.ts). Las dos están en la página y el CSS muestra
// una, así que cambiar el ancho de la ventana no vuelve a dibujar nada.
import type { Words } from '../../platform/view/words.ts';

export type { Words };

export function Say({ words }: { words: Words }) {
  if (words.long === words.short) return <>{words.long}</>;
  return (
    <>
      <span class="long">{words.long}</span>
      <span class="short">{words.short}</span>
    </>
  );
}
