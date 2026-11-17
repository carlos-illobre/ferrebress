// Dónde está una pantalla de Más: en la computadora, «Más ›» abre el panel de Más; en el celular,
// «‹ Más» vuelve a Más. Fuera del marco no hay nada.
import { fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { navigate } from '../../platform/router.ts';
import {
  backToMore,
  crumbMore,
  media,
  moreInMenu,
  moreOpenOnPhone,
  open,
} from '../../views/basic/frame/frame-test-kit.tsx';
import { MoreCrumb } from '../../views/basic/frame/index.ts';

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
    fireEvent.click(crumbMore());
    expect(moreInMenu(side).getAttribute('aria-expanded')).toBe('true');
  });

  it('en el celular, «‹ Más» vuelve a Más', () => {
    media({ phone: true });
    navigate('/administration');
    open({ screens: { administration: Screen } });
    fireEvent.click(backToMore());
    expect(moreOpenOnPhone()).toBe(true);
  });

  it('una pantalla abierta desde otra suma ese paso, que vuelve a ella', () => {
    const back = vi.fn();
    const Child = () => (
      <MoreCrumb name="Lectores" parent={{ name: 'Administración', open: back }} />
    );
    media();
    navigate('/administration');
    open({ screens: { administration: Child } });
    for (const button of screen.getAllByRole('button', { name: 'Administración' }))
      fireEvent.click(button);
    expect(back).toHaveBeenCalledTimes(2);
  });

  it('fuera del marco no hay nada', () => {
    const { container } = render(<Screen />);
    expect(container.innerHTML).toBe('');
  });
});
