import { describe, expect, it, vi } from 'vitest';
import { clearHash, guardNavigation, navigate, route } from './router.ts';

describe('las direcciones', () => {
  it('ir a una dirección la cambia y avisa', () => {
    navigate('/sell');
    expect(location.pathname).toBe('/sell');
    expect(route.get()).toEqual({ path: '/sell', hash: '', search: '', state: null });
  });

  it('atrás o adelante del navegador muestran la dirección a la que se fue', () => {
    navigate('/two');
    history.replaceState(null, '', '/one');
    dispatchEvent(new PopStateEvent('popstate'));
    expect(route.get().path).toBe('/one');
  });

  it('el código del QR se lee y se borra sin dejarlo en el historial', () => {
    navigate('/link#abc', { replace: true });
    const push = vi.spyOn(history, 'pushState');
    expect(route.get()).toMatchObject({ path: '/link', hash: 'abc' });
    clearHash();
    expect(location.hash).toBe('');
    expect(route.get()).toMatchObject({ path: '/link', hash: '' });
    expect(push).not.toHaveBeenCalled();
  });

  it('app-E37: lleva estado y lo de después del ?; reemplazar sin estado conserva el que había', () => {
    navigate('/manual', { state: { from: 'entrance' } });
    expect(route.get()).toEqual({
      path: '/manual',
      hash: '',
      search: '',
      state: { from: 'entrance' },
    });
    navigate('/manual?d=phone&p=2', { replace: true });
    expect(route.get()).toEqual({
      path: '/manual',
      hash: '',
      search: '?d=phone&p=2',
      state: { from: 'entrance' },
    });
    expect(history.state).toEqual({ from: 'entrance' });
    navigate('/manual', { replace: true, state: { from: 'sell' } });
    expect(route.get().state).toEqual({ from: 'sell' });
  });
});

describe('la guarda: preguntar antes de dejar algo sin guardar (02 · R7.13, E64)', () => {
  // El navegador de las pruebas no recorre el historial: atrás es cambiar la dirección y avisar.
  const back = (path: string, state: unknown = null) => {
    history.replaceState(state, '', path);
    dispatchEvent(new PopStateEvent('popstate'));
  };

  it('ir a otra dirección pregunta, y no se va hasta que se acepta', () => {
    navigate('/users/roles/a');
    const asks: (() => void)[] = [];
    const release = guardNavigation((go) => asks.push(go));
    navigate('/sell');
    expect(location.pathname).toBe('/users/roles/a');
    expect(asks).toHaveLength(1);
    asks[0]?.();
    expect(location.pathname).toBe('/sell');
    // Al aceptar, la guarda se va: no vuelve a preguntar.
    navigate('/users');
    expect(location.pathname).toBe('/users');
    expect(asks).toHaveLength(1);
    release();
  });

  it('lo que fuerza el marco no pregunta; la misma dirección tampoco', () => {
    navigate('/users/roles/b');
    const ask = vi.fn();
    const release = guardNavigation(ask);
    navigate('/users/roles/b', { replace: true, state: { step: 1 } });
    navigate('/sell', { force: true });
    expect(location.pathname).toBe('/sell');
    expect(ask).not.toHaveBeenCalled();
    release();
  });

  it('sacarla deja ir sin preguntar y saca el aviso del navegador', () => {
    navigate('/users/roles/c');
    const ask = vi.fn();
    const release = guardNavigation(ask);
    const leaving = new Event('beforeunload', { cancelable: true });
    dispatchEvent(leaving);
    expect(leaving.defaultPrevented).toBe(true);
    release();
    const again = new Event('beforeunload', { cancelable: true });
    dispatchEvent(again);
    expect(again.defaultPrevented).toBe(false);
    navigate('/sell');
    expect(ask).not.toHaveBeenCalled();
    // Sacar una guarda vieja no saca la que vino después.
    const other = vi.fn();
    const next = guardNavigation(other);
    release();
    navigate('/users');
    expect(other).toHaveBeenCalledTimes(1);
    next();
  });

  it('atrás que cambia la dirección vuelve a donde estaba y pregunta; atrás de una hoja no', () => {
    navigate('/users/roles/d');
    const asks: (() => void)[] = [];
    const release = guardNavigation((go) => asks.push(go));
    const backward = vi.spyOn(history, 'back').mockImplementation(() => back('/users/roles'));
    back('/users/roles/d', { step: 'hoja' });
    expect(asks).toHaveLength(0);
    back('/users/roles');
    expect(location.pathname).toBe('/users/roles/d');
    expect(route.get().path).toBe('/users/roles/d');
    expect(asks).toHaveLength(1);
    asks[0]?.();
    expect(backward).toHaveBeenCalledOnce();
    expect(route.get().path).toBe('/users/roles');
    backward.mockRestore();
    release();
  });

  it('una guarda nueva reemplaza a la anterior; atrás vuelve a la dirección con lo de después del #', () => {
    navigate('/users/roles/e#algo');
    const first = vi.fn();
    guardNavigation(first);
    const asks: (() => void)[] = [];
    const release = guardNavigation((go) => asks.push(go));
    back('/users/roles');
    expect(first).not.toHaveBeenCalled();
    expect(asks).toHaveLength(1);
    expect(`${location.pathname}${location.hash}`).toBe('/users/roles/e#algo');
    release();
  });
});
