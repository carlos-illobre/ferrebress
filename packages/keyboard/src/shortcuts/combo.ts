// Una combinación de teclas escrita igual en el mapa y al apretarla: «Alt+R», «Ctrl+Shift+F», «/».
// Las letras y los números salen de la tecla física (event.code), así andan con cualquier
// distribución del teclado y con Alt, que en algunas cambia la letra.
const modifiers = ['Ctrl', 'Alt', 'Shift', 'Meta'] as const;

export function comboOf(event: KeyboardEvent): string {
  const physical = /^(Key|Digit)(.)$/.exec(event.code);
  const key = physical ? (physical[2] as string) : event.key;
  const held = modifiers.filter((name) => event[`${name.toLowerCase()}Key` as 'altKey']);
  return [...held, key.length === 1 ? key.toUpperCase() : key].join('+');
}

// Lo que se muestra de una combinación sobre el botón: sin Alt, que es la de todos (00 · R2.8).
export const shownKey = (combo: string) => combo.replace(/^Alt\+/, '');
