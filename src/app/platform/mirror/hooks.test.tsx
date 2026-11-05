// Lo que usan las pantallas: un valor con nombre, lo que traen del servidor con sus dos modos, y la
// dirección espejada (diseño de 03, § 5.1, § 5.3 y § 5.4).
import { act, render, renderHook, waitFor } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as z from 'zod/mini';
import { navigate, route } from '../router.ts';
import { platformSettings } from '../settings.ts';
import { useMirroredQuery } from './query.ts';
import { createMirror, mirror, type Patch } from './registry.ts';
import { bindRoute } from './route.ts';
import { useMirrored } from './use-mirrored.ts';

const sent: Patch[][] = [];
const connect = (leader: boolean, over: 'direct' | 'relayed' = 'direct') =>
  mirror.attach({ leader, over, send: (patches) => sent.push(patches) });

afterEach(() => {
  mirror.detach();
  sent.length = 0;
  vi.useRealTimers();
});

function Field() {
  const [value, setValue] = useMirrored('test.screen.text', 'a', z.string());
  return (
    <button type="button" onClick={() => setValue(`${value}!`)}>
      {value}
    </button>
  );
}

describe('un valor con nombre en una pantalla', () => {
  it('cambia como un estado, viaja si hay otro y se suelta al desmontar', () => {
    connect(true);
    const view = render(<Field />);
    act(() => view.getByRole('button').click());
    expect(view.getByRole('button').textContent).toBe('a!');
    expect(sent.at(-1)?.[0]).toMatchObject({ k: 'test.screen.text', v: 'a!', l: true });
    act(() => mirror.receive([{ k: 'test.screen.text', v: 'del otro', c: 99, l: false }]));
    expect(view.getByRole('button').textContent).toBe('del otro');
    // Lo que llega sin su forma no entra (el espejo de la aplicación lo descarta en silencio).
    act(() => mirror.receive([{ k: 'test.screen.text', v: 3, c: 100, l: false } as never]));
    expect(view.getByRole('button').textContent).toBe('del otro');
    act(() => view.unmount());
    expect(() => mirror.register('test.screen.text', 'a', z.string()).release()).not.toThrow();
  });
});

const person = z.object({ name: z.string() });
const ok = (name: string) => async () => ({ ok: true as const, data: { name } });

describe('lo que se trae del servidor', () => {
  it('sin espejo pide y guarda; actualizar cambia lo guardado; invalidar vuelve a pedir', async () => {
    const request = vi.fn(ok('Ana'));
    const { result } = renderHook(() =>
      useMirroredQuery('test.card.person:1', request, [], { mode: 'forward', schema: person }),
    );
    await waitFor(() => expect(result.current.data).toEqual({ name: 'Ana' }));
    act(() => result.current.update((now) => ({ ...now, name: 'Beto' })));
    expect(result.current.data).toEqual({ name: 'Beto' });
    act(() => result.current.invalidate());
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
  });

  it('una respuesta que llega después de desmontar no se guarda', async () => {
    let answer: (value: { ok: true; data: { name: string } }) => void = () => undefined;
    const slow = () => new Promise<{ ok: true; data: { name: string } }>((r) => (answer = r));
    const { unmount } = renderHook(() =>
      useMirroredQuery('test.card.person:7', slow, [], { mode: 'forward', schema: person }),
    );
    act(() => unmount());
    answer({ ok: true, data: { name: 'tarde' } });
    await Promise.resolve();
    expect(mirror.register('q:test.card.person:7', null, z.nullable(person)).get()).toBeNull();
  });

  it('una respuesta con error queda como falla', async () => {
    const failing = async () => ({ ok: false as const, error: 'offline' as const });
    const { result } = renderHook(() =>
      useMirroredQuery('test.card.person:2', failing, [], { mode: 'forward', schema: person }),
    );
    await waitFor(() => expect(result.current.failed).toBe(true));
    act(() => result.current.update((now) => now));
    expect(result.current.data).toBeUndefined();
  });

  it('por el directo, el que manda pide y lo que trae viaja', async () => {
    connect(true);
    const { result } = renderHook(() =>
      useMirroredQuery('test.card.person:3', ok('Ana'), [], { mode: 'forward', schema: person }),
    );
    await waitFor(() => expect(result.current.data).toEqual({ name: 'Ana' }));
    expect(sent.at(-1)?.[0]).toMatchObject({ k: 'q:test.card.person:3', v: { name: 'Ana' } });
  });

  it('por el directo, el que sigue no pide: recibe; si a los 3 s no llegó nada, pide él y no viaja', async () => {
    vi.useFakeTimers();
    connect(false);
    const request = vi.fn(ok('Ana'));
    const first = renderHook(() =>
      useMirroredQuery('test.card.person:4', request, [], { mode: 'forward', schema: person }),
    );
    act(() => mirror.receive([{ k: 'q:test.card.person:4', v: { name: 'Ana' }, c: 50, l: true }]));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(platformSettings.mirror.followerWaitMs);
    });
    expect(request).not.toHaveBeenCalled();
    expect(first.result.current.data).toEqual({ name: 'Ana' });
    first.unmount();
    const late = renderHook(() =>
      useMirroredQuery('test.card.person:5', request, [], { mode: 'forward', schema: person }),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(platformSettings.mirror.followerWaitMs);
    });
    expect(request).toHaveBeenCalledTimes(1);
    expect(late.result.current.data).toEqual({ name: 'Ana' });
    expect(sent).toHaveLength(0);
    late.unmount();
  });

  it('por el servidor, o en refetch, cada uno pide lo suyo y no viaja', async () => {
    connect(true, 'relayed');
    const request = vi.fn(ok('Ana'));
    const { result } = renderHook(() =>
      useMirroredQuery('test.card.person:6', request, [], { mode: 'refetch', schema: person }),
    );
    await waitFor(() => expect(result.current.data).toEqual({ name: 'Ana' }));
    expect(sent).toHaveLength(0);
  });
});

describe('la dirección espejada', () => {
  it('lo que se navega acá viaja sin el #; lo que llega del otro navega y no vuelve a viajar', () => {
    const remote = createMirror();
    const out: Patch[][] = [];
    remote.attach({ leader: true, over: 'direct', send: (patches) => out.push(patches) });
    const unbind = bindRoute(remote, (path) => path !== '/fuera');
    navigate('/usuarios?x=1#codigo');
    expect(out.at(-1)?.[0]?.v).toEqual({ path: '/usuarios', search: '?x=1' });
    const before = out.length;
    remote.receive([{ k: 'frame.route', v: { path: '/mas', search: '' }, c: 999, l: false }]);
    expect(route.get().path).toBe('/mas');
    expect(out).toHaveLength(before);
    remote.receive([{ k: 'frame.route', v: { path: '/mas', search: '' }, c: 1000, l: false }]);
    // Una dirección que no acepta (fuera del menú) no navega.
    remote.receive([{ k: 'frame.route', v: { path: '/fuera', search: '' }, c: 1001, l: false }]);
    expect(route.get().path).toBe('/mas');
    unbind();
  });
});
