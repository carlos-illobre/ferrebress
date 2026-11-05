// Debajo del título, en el celular: el indicador del vínculo y la luz solo sin conexión (pedido de
// Carlos, 01 · R6); sin las piezas del vínculo, la luz siempre.
import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { FrameContext, type FrameLink, type FrameState } from './context.ts';
import { PhoneLight } from './screens/Phone/Phone.tsx';

const link: FrameLink = {
  Side: () => null,
  Phone: ({ light, offline }) => (
    <>
      <span>Sin vincular</span>
      {offline && light}
    </>
  ),
  Over: () => null,
};

function show(online: boolean, withLink: boolean) {
  const toggle = vi.fn();
  const frame = { online, link: withLink ? link : undefined, panels: { toggle } };
  render(
    <FrameContext.Provider value={frame as unknown as FrameState}>
      <PhoneLight />
    </FrameContext.Provider>,
  );
  return toggle;
}

describe('debajo del título, en el celular', () => {
  it('en línea, solo el vínculo', () => {
    show(true, true);
    expect(screen.getByText('Sin vincular')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('sin conexión, también la luz, que abre lo pendiente', () => {
    const toggle = show(false, true);
    fireEvent.click(screen.getByRole('button'));
    expect(toggle).toHaveBeenCalledWith('phonePending');
  });

  it('sin el vínculo, la luz siempre; fuera del marco, nada', () => {
    show(true, false);
    expect(screen.getByRole('button')).toBeTruthy();
    const alone = render(<PhoneLight />);
    expect(alone.container.innerHTML).toBe('');
  });
});
