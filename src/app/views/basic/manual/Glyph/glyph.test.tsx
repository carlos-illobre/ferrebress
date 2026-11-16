import { render } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { one } from '../manual-test-kit.tsx';
import { Glyph } from './Glyph.tsx';

describe('un ícono del manual', () => {
  it('dibuja sus formas; uno que no está, nada', () => {
    const { container } = render(<Glyph name="search" size="large" />);
    expect(one('glyphDrawn', container)).not.toBeNull();
    const empty = render(<Glyph name="nada" />);
    expect(one('glyph', empty.container)?.childElementCount).toBe(0);
  });
});
