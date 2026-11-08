// Dónde está una pantalla de Más: en la computadora, «Más ›» abre el panel de Más; en el celular,
// «‹ Más» vuelve a Más. Fuera del marco no hay nada.
import { fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { navigate } from '../../platform/router.ts';
import { media, open } from './frame-test-kit.tsx';
import { MoreCrumb } from './index.ts';

const Screen = () => <MoreCrumb name="Administración" />;

describe('la miga de Más', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    navigate('/', { replace: true });
  });

  it('en la computadora, «Más» abre el panel de Más', () => {
    media();
    navigate('/administration');
    const { side } = open({ screens: { administration: Screen } });
    expect(screen.getByText('Administración', { selector: '.more-crumbs span' })).toBeTruthy();
    fireEvent.click(document.querySelector('.more-crumbs button') as HTMLElement);
    expect(side.querySelector('.part.more')?.getAttribute('aria-expanded')).toBe('true');
  });

  it('en el celular, «‹ Más» vuelve a Más', () => {
    media({ phone: true });
    navigate('/administration');
    open({ screens: { administration: Screen } });
    fireEvent.click(document.querySelector('.more-back') as HTMLElement);
    expect(document.querySelector('.frame')?.classList.contains('more-open')).toBe(true);
  });

  it('fuera del marco no hay nada', () => {
    const { container } = render(<Screen />);
    expect(container.innerHTML).toBe('');
  });
});
