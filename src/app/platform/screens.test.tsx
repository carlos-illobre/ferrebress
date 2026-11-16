import { render } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { openScreens, topScreen, useScreen } from './screens.ts';

function Screen({ name, model, shown }: { name: string; model: unknown; shown?: boolean }) {
  useScreen(name, model, shown);
  return null;
}

describe('las pantallas abiertas', () => {
  it('la última que se abre está arriba, y al cerrarse sale; el modelo es siempre el de ahora', () => {
    const page = render(<Screen name="list" model={1} />);
    page.rerender(
      <>
        <Screen name="list" model={2} />
        <Screen name="sheet" model={3} />
      </>,
    );
    expect(topScreen()?.name).toBe('sheet');
    expect(openScreens.get()[0]?.model()).toBe(2);
    page.rerender(<Screen name="list" model={2} />);
    expect(topScreen()?.name).toBe('list');
    page.unmount();
    expect(topScreen()).toBeUndefined();
  });

  it('lo que se abre encima se anuncia solo mientras se ve', () => {
    const page = render(<Screen name="confirm" model={1} shown={false} />);
    expect(topScreen()).toBeUndefined();
    page.rerender(<Screen name="confirm" model={1} shown />);
    expect(topScreen()?.name).toBe('confirm');
    page.unmount();
  });
});
