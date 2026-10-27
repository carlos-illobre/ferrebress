// Un texto con sus dos formas (00 · R3): la larga, que explica, en la computadora; la corta, que solo
// identifica, en el celular y en cualquier pantalla angosta. Las dos están en la página y el CSS
// muestra una, así que cambiar el ancho de la ventana no vuelve a dibujar nada.
export type Words = { long: string; short: string };

export function Say({ words }: { words: Words }) {
  if (words.long === words.short) return <>{words.long}</>;
  return (
    <>
      <span class="long">{words.long}</span>
      <span class="short">{words.short}</span>
    </>
  );
}
