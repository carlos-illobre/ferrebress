import { describe, expect, it, vi } from 'vitest';
import { clearHash, navigate, route } from './router.ts';

describe('las direcciones', () => {
  it('ir a una dirección la cambia y avisa', () => {
    navigate('/sell');
    expect(location.pathname).toBe('/sell');
    expect(route.get()).toEqual({ path: '/sell', hash: '' });
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
    expect(route.get()).toEqual({ path: '/link', hash: 'abc' });
    clearHash();
    expect(location.hash).toBe('');
    expect(route.get()).toEqual({ path: '/link', hash: '' });
    expect(push).not.toHaveBeenCalled();
  });
});
