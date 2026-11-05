// Usuarios en los dos dispositivos (capítulo 03, E32 y E33b): lo que llega del otro por el espejo
// abre la misma tarjeta y escribe lo mismo en el buscador; cada uno muestra lo que pidió él.
import { act, screen, waitFor } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mirror } from '../../platform/mirror/registry.ts';
import { access, card, inCard, openUsers, row } from './users-test-kit.tsx';

afterEach(() => vi.unstubAllGlobals());

describe('Usuarios, desde el otro dispositivo', () => {
  it('03-E32: la tarjeta que abre el otro se abre acá, pedida por este', async () => {
    const server = openUsers({ '/api/users/graciela/access': { body: access } });
    await screen.findByText('Rubén Paredes');
    act(() => mirror.receive([{ k: 'users.list.selected', v: 'graciela', c: 900, l: true }]));
    expect(await inCard().findByText('Chrome en Windows')).toBeTruthy();
    expect(card().textContent).toContain('Graciela');
    expect(row(/Graciela/).getAttribute('aria-current')).toBe('true');
    expect(server.sent.map((s) => s.path)).toContain('/api/users/graciela/access');
  });

  it('03-E33b: lo que se escribe en el buscador del otro aparece acá, con los resultados de acá', async () => {
    openUsers();
    const search = (await screen.findByRole('searchbox')) as HTMLInputElement;
    act(() => mirror.receive([{ k: 'users.list.search', v: 'graciela', c: 950, l: true }]));
    await waitFor(() => expect(search.value).toBe('graciela'));
    expect(screen.queryByText('Rubén Paredes')).toBeNull();
    expect(screen.getByText('Graciela Benítez')).toBeTruthy();
  });
});
