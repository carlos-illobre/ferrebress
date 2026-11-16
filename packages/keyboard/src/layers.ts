// Qué está arriba en la página: cada pantalla, y lo que se abre encima, es una capa marcada con
// data-layer; vale solo la de más arriba que se ve. Lo usan las dos capas del teclado.
export const visible = (element: Element) => element.checkVisibility();
export const layers = () => [...document.querySelectorAll('[data-layer]')].filter(visible);
export const topLayer = (): Element => layers().at(-1) ?? document.body;
