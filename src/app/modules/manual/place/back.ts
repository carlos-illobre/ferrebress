// A dónde vuelve «Volver» (00 · R6.7, diseño del manual, § 5): quien abre el manual guarda en la
// historia de dónde viene, de una lista cerrada (la entrada, una parte del menú o Más), y el nombre
// que se muestra sale de esa lista, nunca de un texto guardado. Sin de dónde (se escribió la
// dirección), «Ir a Ferrebress» lleva al principio; `app` (Más sin una parte abierta) dice
// «Ferrebress». Nunca lleva a una dirección que venga de afuera.
import { navigate } from '../../../platform/router.ts';
import { parts } from '../../frame/index.ts';

// A dónde vuelve «Volver»: el nombre largo (computadora), el corto (celular) y cómo.
export type Back = { long: string; short: string; go: (open: number) => void };

// Sus textos viven acá y no en texts.ts: este archivo va en el arranque y texts.ts no.
export const backTexts = {
  goToApp: 'Ir a Ferrebress',
  backTo: (place: string) => `Volver a ${place}`,
};

const places: Record<string, string> = {
  entrance: 'la entrada',
  more: 'Más',
  app: 'Ferrebress',
  ...Object.fromEntries(parts.map((part) => [part.id, part.name])),
};

const shortNames: Record<string, string> = { entrance: 'Entrada' };

export function backOf(state: unknown): Back {
  const from = (state as { from?: unknown } | null)?.from;
  // Solo las claves propias de la lista: `constructor` o `__proto__` no son un lugar.
  const place = typeof from === 'string' && Object.hasOwn(places, from) ? places[from] : undefined;
  if (!place)
    return {
      long: backTexts.goToApp,
      short: 'Ferrebress',
      go: () => navigate('/', { replace: true }),
    };
  return {
    long: backTexts.backTo(place),
    short: shortNames[from as string] ?? place,
    // Cada hoja abierta es un paso atrás más (useBackStep).
    go: (open) => history.go(-(open + 1)),
  };
}
