// Qué está arriba en la página: cada pantalla, y lo que se abre encima, es una capa marcada con
// data-layer; vale solo la de más arriba que se ve. Lo usan las dos capas del teclado.
export const visible = (element: Element) => element.checkVisibility();
export const layers = () => [...document.querySelectorAll('[data-layer]')].filter(visible);
export const topLayer = (): Element => layers().at(-1) ?? document.body;

// Una región con letras propias (data-letters, como un menú) dentro de la capa de arriba, o la capa
// misma: ahí las letras van sin Alt, y con Alt no la alcanzan.
export const lettersOf = (element: Element): Element | undefined => {
  const region = element.closest('[data-letters]');
  const top = topLayer();
  return region && (region === top || top.contains(region)) ? region : undefined;
};
