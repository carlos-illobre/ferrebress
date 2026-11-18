// «Para revisar», aparte y arriba de todo (08 · R6.4, E57; pantalla 3).
import { fireEvent, screen, waitFor } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { openReview, rows, rowsPath } from '../../../views/basic/price-lists/review/kit.tsx';

const button = (name: string | RegExp) => screen.getByRole('button', { name });

describe('para revisar', () => {
  it('price-lists-R6.4 y E57: «para revisar» aparte, arriba de todo; si son más, se ven todos con su filtro', async () => {
    openReview({ [`${rowsPath}?show=review`]: { body: { rows: [rows[0]], next: 'n' } } });
    expect(await screen.findByRole('heading', { name: 'Para revisar' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Todos' })).toBeTruthy();
    // El de arriba y el mismo en todos, cada uno con su cuenta.
    expect(screen.getAllByText('Mecha 6')).toHaveLength(2);
    fireEvent.click(button('Ver todos los para revisar'));
    expect(button('3 para revisar').getAttribute('aria-pressed')).toBe('true');
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Para revisar' })).toBeNull());
  });
});
