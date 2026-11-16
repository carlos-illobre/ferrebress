// Cómo declara una pantalla sus atajos: cada comando tiene un nombre y lo que hace sobre el
// modelo de la pantalla. No dice ninguna tecla: las pone el mapa de teclas. Un comando que en ese momento no
// se puede usar (el botón no está, o está apagado) devuelve false, y la tecla sigue de largo.
export type Command<M> = (model: M) => unknown;
export type ScreenShortcuts = { screen: string; commands: Record<string, Command<never>> };

export function defineShortcuts<M>(
  screen: string,
  commands: Record<string, Command<M>>,
): ScreenShortcuts {
  return { screen, commands: commands as Record<string, Command<never>> };
}
