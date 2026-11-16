// El conductor de Configuración en la vista básica (ADR-019): lo que las pruebas necesitan de cómo
// está armado el HTML y no se busca por rol ni por texto.

// El resumen de arriba, con lo elegido de cada ajuste.
export const summary = () => document.querySelector('.settings-chips') as HTMLElement;

// Cómo se ve una hora en la aplicación, en el ejemplo del formato de la hora.
export const seenText = () =>
  String((document.querySelector('.settings-seen') as HTMLElement).textContent).replace(/\s/g, ' ');

// Los dos botones del formato de la hora: 24 h y 12 h.
export const formats = () => [...document.querySelectorAll<HTMLElement>('.settings-format')];

// Las partes de «Este dispositivo» y de lo tuyo que las pruebas miran (ADR-019).
const parts = {
  shining: '.mine-device.shines',
  serverOffline: '.mine-server.is-offline',
  load: '.mine-load',
  counts: '.mine-counts',
} as const;
export const one = (name: keyof typeof parts) => document.querySelector<HTMLElement>(parts[name]);
// La tarjeta de un dispositivo, por su título, y el recibo de lo que se cortó.
export const articleOf = (element: Element) => element.closest('article') as HTMLElement;
export const receiptOf = (element: Element) => element.closest('.mine-receipt') as HTMLElement;
