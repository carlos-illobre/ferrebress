import { act, fireEvent, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { updateRequired } from '../../platform/server/api.ts';
import { index, loaded, media, serveManual, show } from './manual-test-kit.tsx';

const guide = () => screen.getByRole('main') as HTMLElement;

describe('el manual en la computadora', () => {
  beforeEach(() => media());
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    updateRequired.set(false);
  });

  it('R6.3: arranca en el dispositivo que se usa, con la primera tarea; el selector cambia todo', async () => {
    serveManual();
    show();
    await loaded();
    expect(screen.getAllByRole('button', { name: /Computadora/, pressed: true })).toHaveLength(2);
    await waitFor(() => expect(within(guide()).getByText('Mirá el código.')).toBeTruthy());
    expect(screen.queryByText('Entrar sin internet')).toBeNull();
    fireEvent.click(screen.getAllByRole('button', { name: /Celular/ })[0] as HTMLElement);
    expect(screen.getAllByText('Entrar sin internet').length).toBeGreaterThan(0);
    expect(screen.queryByText('Entrar con Google')).toBeNull();
    expect(location.search).toBe('?d=phone&c=sign-in&t=offline&p=1');
  });

  it('app-E35, R10.1: los capítulos que faltan con «Pronto», también en producción; el cartel, solo en pruebas', async () => {
    serveManual();
    show();
    await loaded();
    expect(screen.getByText('Próximos capítulos')).toBeTruthy();
    expect(screen.getByText('Vender').parentElement?.textContent).toContain('Pronto');
    // R10.1: en pruebas, el manual lleva el cartel del ambiente, como toda pantalla.
    expect(screen.getByText(/Ambiente de prueba/)).toBeTruthy();
    // El que lleva a otro capítulo no sale en la computadora: no tiene tarea para ella.
    expect(screen.queryByText('Trabajar sin conexión')).toBeNull();
    serveManual();
    show({ testing: false });
    await loaded();
    expect(screen.getAllByText('Próximos capítulos').length).toBeGreaterThan(0);
    expect(screen.queryByText(/Ambiente de prueba/)).toBeNull();
  });

  it('pasa de paso y de tarea; el último dice «Terminado»; el número, la frase y el consejo cambian', async () => {
    serveManual();
    show();
    await waitFor(() => expect(within(guide()).getByText('Mirá el código.')).toBeTruthy());
    expect(within(guide()).getByText('Paso 1 de 3 · No escribís nada.')).toBeTruthy();
    expect(within(guide()).getByText('El código cambia cada minuto.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Paso anterior' }).hasAttribute('disabled')).toBe(
      true,
    );
    fireEvent.click(screen.getByRole('button', { name: /^Siguiente/ }));
    expect(within(guide()).getByText('Tocá «Escanear».')).toBeTruthy();
    // El paso del otro dispositivo lo aclara (R6.3).
    expect(within(guide()).getByText('En el celular')).toBeTruthy();
    expect(guide().querySelector('.manual-ring-label')?.className).toContain('to-right to-up');
    expect(within(guide()).getByText('Los dos en el mismo Wi-Fi.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Paso 3' }));
    expect(within(guide()).getByText('Poné la huella.')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Siguiente: Entrar con Google/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Siguiente: Entrar con Google/ }));
    await waitFor(() => expect(within(guide()).getByText('Elegí tu cuenta.')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /^Siguiente/ }));
    expect(screen.getByRole('button', { name: /Terminado/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Paso anterior' }));
    fireEvent.click(screen.getByRole('button', { name: 'Paso anterior' }));
    expect(within(guide()).getByText('Poné la huella.')).toBeTruthy();
  });

  it('las capturas se bajan como blob, una vez; la que no llega dice «Sin conexión» y se pide al volver la red', async () => {
    const { asked } = serveManual({ 'media/desktop-entrance.webp': 'offline' });
    show();
    await waitFor(() => expect(within(guide()).getByText('Sin conexión')).toBeTruthy());
    serveManual();
    act(() => {
      dispatchEvent(new Event('online'));
    });
    await waitFor(() =>
      expect(guide().querySelector('img[alt="Captura: El código"]')).not.toBeNull(),
    );
    expect(asked.filter((path) => path.endsWith('desktop-entrance.webp'))).toHaveLength(1);
    const ring = guide().querySelector('.manual-ring') as HTMLElement;
    expect(ring.style.getPropertyValue('left')).toBe('70%');
    expect(guide().querySelector('.manual-ring-label')?.className).toContain('to-left to-down');
    // Una captura de la computadora más alta que el lugar se achica entera.
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1000);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(300);
    act(() => {
      dispatchEvent(new Event('resize'));
    });
    expect(
      guide().querySelector<HTMLElement>('.manual-capture')?.style.getPropertyValue('width'),
    ).toBe('533px');
    // Un rótulo que no entra en el escenario se corre hacia adentro, de un lado o del otro.
    const rect = (left: number, right: number) =>
      ({ left, right, top: 0, width: right - left, height: 0 }) as DOMRect;
    const label = guide().querySelector('.manual-ring-label') as HTMLElement;
    const layer = label.parentElement as HTMLElement;
    vi.spyOn(layer, 'getBoundingClientRect').mockReturnValue(rect(0, 500));
    vi.spyOn(label, 'getBoundingClientRect').mockReturnValue(rect(450, 600));
    act(() => {
      dispatchEvent(new Event('resize'));
    });
    expect(label.style.getPropertyValue('margin-left')).toBe('-108px');
    vi.spyOn(label, 'getBoundingClientRect').mockReturnValue(rect(-50, 100));
    act(() => {
      dispatchEvent(new Event('resize'));
    });
    expect(label.style.getPropertyValue('margin-left')).toBe('58px');
    vi.restoreAllMocks();
  });

  it('un paso sin captura muestra su ícono sobre la captura anterior, velada', async () => {
    serveManual();
    show({ at: '/manual?d=computer&c=sign-in&t=phone&p=3' });
    await waitFor(() => expect(within(guide()).getByText('Poné la huella.')).toBeTruthy());
    expect(guide().querySelector('.manual-veil:not(.alone)')).not.toBeNull();
    serveManual();
    show({ at: '/manual?d=computer&c=sign-in&t=google&p=1' });
    await waitFor(() => expect(document.querySelector('.manual-veil.alone')).not.toBeNull());
  });

  it('app-E38: el clip está quieto y sin sonido hasta que se lo pide; con «reducir movimiento», el último cuadro', async () => {
    serveManual();
    const play = vi.fn(() => Promise.resolve());
    Object.defineProperty(HTMLMediaElement.prototype, 'play', { configurable: true, value: play });
    show();
    await waitFor(() => expect(screen.getByRole('button', { name: /Ver el clip/ })).toBeTruthy());
    expect(document.querySelector('video')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Ver el clip/ }));
    const video = document.querySelector('video') as HTMLVideoElement;
    expect(video.getAttribute('preload')).toBe('none');
    expect(video.muted).toBe(true);
    expect(video.getAttribute('src')).toBe('/manual/media/phone-to-computer.webm');
    expect(play).toHaveBeenCalledOnce();
    fireEvent(video, new Event('ended'));
    fireEvent.click(screen.getByRole('button', { name: /Ver cómo se hace/ }));
    expect(play).toHaveBeenCalledTimes(2);
    play.mockImplementationOnce(() => Promise.reject(new Error('sin permiso')));
    fireEvent.click(screen.getByRole('button', { name: 'Paso 2' }));
    fireEvent.click(screen.getByRole('button', { name: /Ver el clip/ }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Ver cómo se hace/ })).toBeTruthy(),
    );
    media({ still: true });
    fireEvent.click(screen.getByRole('button', { name: 'Paso 1' }));
    fireEvent.click(screen.getByRole('button', { name: /Ver el clip/ }));
    expect(document.querySelector('video')).toBeNull();
    expect(document.querySelector('.manual-clip img')?.getAttribute('src')).toBe(
      '/manual/media/phone-to-computer.end.webp',
    );
  });

  it('R6.5: «Todos los pasos» muestra el capítulo entero; desde una tarea llega a ella y destella', async () => {
    serveManual();
    show();
    await waitFor(() => expect(within(guide()).getByText('Mirá el código.')).toBeTruthy());
    fireEvent.click(within(guide()).getByRole('button', { name: /Todos los pasos/ }));
    const all = screen.getByRole('region', { name: 'Entrar · todos los pasos' });
    expect(within(all).getByText('Entrás en la computadora.')).toBeTruthy();
    expect(within(all).getByText('La forma más rápida')).toBeTruthy();
    expect(within(all).getAllByRole('listitem').length).toBeGreaterThan(4);
    expect(all.querySelector('.flash')?.getAttribute('data-task')).toBe('phone');
    fireEvent.click(within(all).getByRole('button', { name: /Volver al paso a paso/ }));
    expect(screen.queryByRole('region', { name: /todos los pasos/ })).toBeNull();
    fireEvent.click(
      screen.getAllByRole('button', {
        name: /Todos los pasos El capítulo entero/,
      })[0] as HTMLElement,
    );
    expect(
      screen.getByRole('region', { name: /todos los pasos/ }).querySelector('.flash'),
    ).toBeNull();
  });

  it('app-E37: «Volver» dice a dónde y vuelve; sin hojas abiertas, un paso atrás', async () => {
    serveManual();
    const back = show();
    await loaded();
    fireEvent.click(screen.getByRole('button', { name: /Volver a la entrada/ }));
    expect(back.go).toHaveBeenCalledWith(0);
  });

  it('la dirección deja donde se estaba al recargar; lo que no existe se ignora', async () => {
    serveManual();
    show({ at: '/manual?d=computer&c=sign-in&t=google&p=2' });
    await waitFor(() => expect(within(guide()).getByText('Listo.')).toBeTruthy());
    serveManual();
    show({ at: '/manual?c=../api/start&t=x' });
    await waitFor(() => expect(location.search).toBe('?d=computer&c=sign-in&t=phone&p=1'));
    // app-E53: lo que se pide sale siempre de /manual/, aunque la dirección diga otra cosa.
    const { asked } = serveManual();
    show({ at: '/manual?c=nada&t=x' });
    await loaded();
    await waitFor(() => expect(asked).toContain('/manual/nada.json'));
    expect(asked.every((path) => path.startsWith('/manual/'))).toBe(true);
  });

  it('sin conexión al abrir, lo dice y deja volver; un archivo que falta o de otra versión pide actualizar', async () => {
    serveManual({ 'index.json': 'offline' });
    const back = show();
    fireEvent.click(await screen.findByRole('button', { name: /Volver a la entrada/ }));
    expect(screen.getByText('El manual necesita internet.')).toBeTruthy();
    expect(back.go).toHaveBeenCalledWith(0);
    serveManual({ 'index.json': 'missing' });
    show();
    await waitFor(() => expect(updateRequired.get()).toBe(true));
    updateRequired.set(false);
    serveManual({ 'index.json': { ...index, version: 'otra' } });
    show();
    await waitFor(() => expect(updateRequired.get()).toBe(true));
    updateRequired.set(false);
    serveManual({ 'sign-in.json': 'broken' });
    show();
    await waitFor(() => expect(updateRequired.get()).toBe(true));
  });

  it('R4.4, R4.6: un capítulo que no llegó por falta de red dice «Sin conexión» y se pide al volver la red', async () => {
    const { asked } = serveManual({ 'sign-in.json': 'offline' });
    show();
    await loaded();
    expect(await screen.findByRole('heading', { name: 'Sin conexión' })).toBeTruthy();
    serveManual();
    act(() => {
      dispatchEvent(new Event('online'));
    });
    await waitFor(() => expect(within(guide()).getByText('Mirá el código.')).toBeTruthy());
    expect(asked).toEqual(['/manual/index.json', '/manual/sign-in.json']);
  });
});
