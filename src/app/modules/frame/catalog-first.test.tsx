// Con la pantalla de Catálogo, la aplicación abre en él: es la primera opción del menú que existe
// (00 · R1.4).
import { screen } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { navigate } from '../../platform/router.ts';
import { media, open } from '../../views/basic/frame/frame-test-kit.tsx';

describe('al abrir, con Catálogo', () => {
  afterEach(() => navigate('/', { replace: true }));

  it('app-R1.4: abre en Catálogo, la primera opción que existe', () => {
    media();
    open({ screens: { catalog: () => <p>La pantalla de Catálogo</p> } });
    expect(screen.getByRole('main').textContent).toBe('La pantalla de Catálogo');
  });
});
