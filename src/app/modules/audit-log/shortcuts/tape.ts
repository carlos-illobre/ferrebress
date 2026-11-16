// El atajo de la cinta de Quién hizo qué (05 · R4.11): reproducir o pausar el día.
import { defineShortcuts } from '@ferrebress/keyboard';
import type { TapeState } from '../useTape.ts';

export const shortcuts = defineShortcuts<TapeState>('audit-tape', {
  play: (tape) => tape.events.length > 0 && tape.play.toggle(),
});
