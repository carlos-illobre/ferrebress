// El conductor de Configuración en la vista básica (ADR-019): lo que las pruebas necesitan de cómo
// está armado el HTML y no se busca por rol ni por texto.

// El resumen de arriba, con lo elegido de cada ajuste.
export const summary = () => document.querySelector('.settings-chips') as HTMLElement;

// Cómo se ve una hora en la aplicación, en el ejemplo del formato de la hora.
export const seenText = () =>
  String((document.querySelector('.settings-seen') as HTMLElement).textContent).replace(/\s/g, ' ');

// Los dos botones del formato de la hora: 24 h y 12 h.
export const formats = () => [...document.querySelectorAll<HTMLElement>('.settings-format')];
