// Qué está arriba en la pantalla (00 · R2.10): cada pantalla, y lo que se abre encima, es una capa
// marcada con data-layer; vale solo la de más arriba que se ve. Lo usan las capas del teclado
// (keyboard/), que no se conocen entre sí, y lo cumple cada vista (ADR-019).
export const visible = (element: Element) => element.checkVisibility();
export const layers = () => [...document.querySelectorAll('[data-layer]')].filter(visible);
export const topLayer = (): Element => layers().at(-1) ?? document.body;
