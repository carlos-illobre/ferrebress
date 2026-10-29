import { describe, expect, it, vi } from 'vitest';
import { clearHash, navigate, route } from './router.ts';

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

  it('manual-E37: lleva estado y lo de después del ?; reemplazar sin estado conserva el que había', () => {
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
