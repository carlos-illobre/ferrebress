import { render } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { Glyph } from './Glyph.tsx';

describe('un ícono del manual', () => {
  it('dibuja sus formas; uno que no está, nada', () => {
    const { container } = render(<Glyph name="search" size="large" />);
    expect(container.querySelector('svg.icon-large circle')).not.toBeNull();
    const empty = render(<Glyph name="nada" />);
    expect(empty.container.querySelector('svg')?.childElementCount).toBe(0);
  });
});
