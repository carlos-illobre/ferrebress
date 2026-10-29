// A dónde vuelve «Volver» (00 · R6.7, diseño del manual, § 5): quien abre el manual guarda en la
// historia de dónde viene, de una lista cerrada (la entrada, una parte del menú o Más), y el nombre
// que se muestra sale de esa lista, nunca de un texto guardado. Sin de dónde (se escribió la
// dirección), «Ir a Ferrebress» lleva al principio. Nunca lleva a una dirección que venga de afuera.

import { navigate } from '../../platform/router.ts';
import { parts } from '../frame/index.ts';
import type { Back } from './screens/Manual/Manual.tsx';
import { texts } from './texts.ts';

const places: Record<string, string> = {
  entrance: 'la entrada',
  more: 'Más',
  app: 'Ferrebress',
  ...Object.fromEntries(parts.map((part) => [part.id, part.name])),
};

const shortNames: Record<string, string> = { entrance: 'Entrada', 'la entrada': 'Entrada' };

export function backOf(state: unknown): Back {
  const from = (state as { from?: unknown } | null)?.from;
  const place = typeof from === 'string' ? places[from] : undefined;
  if (!place)
    return { long: texts.goToApp, short: 'Ferrebress', go: () => navigate('/', { replace: true }) };
  return {
    long: texts.backTo(place),
    short: shortNames[from as string] ?? place,
    // Cada hoja abierta es un paso atrás más (useBackStep).
    go: (open) => history.go(-(open + 1)),
  };
}
