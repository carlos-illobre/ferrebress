// Lo de un intento viejo no llega a ningún paso (diseño de 08, § 8).
import { describe, expect, it } from 'vitest';
import { runStep } from './steps.ts';

describe('los pasos de la lectura', () => {
  it('si la lista ya no se lee en ese intento, no hace nada', async () => {
    const later = { stop: [], restart: [], after: [] };
    await runStep({} as never, {} as never, undefined, { type: 'done' }, later);
    expect(later).toEqual({ stop: [], restart: [], after: [] });
  });
});
