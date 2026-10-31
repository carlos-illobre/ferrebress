// Los capítulos plegables de la lista del manual (00 · R6.9).
import { fireEvent, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chapter, loaded, media, serveManual, show } from './manual-test-kit.tsx';

const fold = (name: string) => screen.getByRole('button', { name });

describe('los capítulos del manual, plegables', () => {
  beforeEach(() => media());
  afterEach(() => vi.unstubAllGlobals());

  it('los capítulos se pliegan: arranca abierto el de la tarea que se lee, y se abren varios', async () => {
    serveManual();
    show();
    await loaded();
    const signIn = screen.getByRole('button', { name: 'Entrar' });
    expect(signIn.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('button', { name: /Entrar con el celular/ })).toBeTruthy();
    fireEvent.click(signIn);
    expect(signIn.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('button', { name: /Entrar con el celular/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Próximos capítulos' }));
    fireEvent.click(signIn);
    expect(screen.getByRole('button', { name: /Entrar con el celular/ })).toBeTruthy();
    expect(screen.getByText('Vender')).toBeTruthy();
  });

  it('una tarea abierta desde el buscador abre su capítulo, aunque estuviera plegado', async () => {
    serveManual();
    show();
    await loaded();
    fireEvent.click(fold('Entrar'));
    expect(fold('Entrar').getAttribute('aria-expanded')).toBe('false');
    const search = screen.getByRole('searchbox', { name: 'Buscar en el manual' });
    fireEvent.input(search, { target: { value: 'google' } });
    fireEvent.click(await screen.findByRole('button', { name: /^Entrar con Google/ }));
    fireEvent.input(search, { target: { value: '' } });
    await waitFor(() => expect(fold('Entrar').getAttribute('aria-expanded')).toBe('true'));
  });

  it('R6.10: la última tarea del manual dice «Terminado»', async () => {
    const stock = {
      id: 'stock',
      name: 'Stock',
      intro: { computer: 'Contás.', phone: 'Contás.' },
      tasks: [
        {
          ...chapter.tasks[0],
          id: 'count',
          title: 'Contar',
          steps: [{ text: 'Contá.', icon: 'package' }],
        },
      ],
    };
    serveManual({ 'stock.json': stock });
    show({ at: '/manual?d=computer&c=stock&t=count&p=1' });
    await loaded();
    await waitFor(() => expect(screen.getByRole('button', { name: /Terminado/ })).toBeTruthy());
  });
});
