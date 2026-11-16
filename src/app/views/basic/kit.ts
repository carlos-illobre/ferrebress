// El conductor de lo común de la vista básica (ADR-019): lo que las pruebas necesitan saber de cómo
// está armado el HTML y que no se busca por rol ni por texto. Las pruebas lo usan; cambiar de vista
// es cambiar estos conductores.

// La tecla que muestra un botón (00 · R2.9).
export const keyShown = (element: Element) => element.querySelector('kbd')?.textContent;

// Lo que dice la tostada de abajo.
export const toastText = () => document.querySelector('.toast')?.textContent;

// Lo que queda atrás mientras el manual está abierto, y la página del manual.
export const behindManual = () => document.querySelector('.behind-manual') as HTMLElement;
export const manualPage = () => document.querySelector<HTMLElement>('.manual-page');

// El marco del ambiente de pruebas (00 · R10.1).
export const testFrameShown = () => document.querySelector('.test-frame') !== null;

// El primer botón de una región.
export const firstButton = (region: Element) => region.querySelector('button') as HTMLElement;

// El texto del rótulo de una caja.
export const labelOf = (box: Element) => box.closest('label')?.textContent;

// El formulario de una región, para mandarlo.
export const formIn = (region: Element) => region.querySelector('form') as HTMLFormElement;

// La parte abierta de un menú.
export const currentIn = (menu: Element) => menu.querySelector('[aria-current="page"]');
