import { act, fireEvent, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installState } from '../../platform/install.ts';
import { startKeyboard } from '../../platform/keyboard.ts';
import { mirror, type Patch } from '../../platform/mirror/registry.ts';
import { bindRoute } from '../../platform/mirror/route.ts';
import { motionOff, still, watchMotion } from '../../platform/motion.ts';
import { navigate } from '../../platform/router.ts';
import { timeFormat } from '../../platform/time.ts';
import { fakeServer } from '../../testing/fake-server.ts';
import { stubMedia } from '../../testing/media.ts';
import { administrator } from '../../testing/person.ts';
import { open } from '../frame/frame-test-kit.tsx';
import { person } from '../sign-in/index.ts';
import { Settings, watchPreferences } from './index.ts';

const juan = {
  userId: '0190a000-0000-7000-8000-000000000001',
  name: 'Juan Pérez',
  email: 'juan@example.com',
  ...administrator,
};

let stop: () => void;

function openSettings({ phone = false, reduced = false, who = juan } = {}) {
  // Lo mío, que no es de estas pruebas: el servidor no lo tiene.
  fakeServer({ '/api/me/devices': 'waiting' });
  stubMedia((query) => (query.includes('max-width') ? phone : query.includes('reduce') && reduced));
  if (phone) vi.stubGlobal('navigator', { ...navigator, userAgent: 'Android' });
  act(() => person.set(who));
  navigate('/device-settings');
  open({ who, screens: { deviceSettings: Settings } });
}

const animations = () => screen.getByRole('switch', { name: /Animaciones/ });
const summary = () => document.querySelector('.settings-chips') as HTMLElement;

describe('Más → Configuración', () => {
  beforeEach(() => {
    localStorage.clear();
    stop = watchPreferences();
  });
  afterEach(() => {
    stop();
    act(() => person.set(undefined));
    act(() => installState.set('cannot'));
    vi.unstubAllGlobals();
    navigate('/', { replace: true });
  });

  it('device-settings-E01: está para cualquiera con sesión, sin permisos', () => {
    openSettings({ who: { ...juan, permissions: [] } });
    expect(screen.getByRole('heading', { name: 'Configuración' })).toBeTruthy();
    expect(animations()).toBeTruthy();
  });

  it('device-settings-E12, E13, E32: arranca con movimiento; apagadas, el resumen lo dice en el acto', () => {
    openSettings();
    expect(animations().getAttribute('aria-checked')).toBe('true');
    expect(summary().textContent).toContain('Con movimiento');
    fireEvent.click(animations());
    expect(animations().getAttribute('aria-checked')).toBe('false');
    expect(motionOff.get()).toBe(true);
    expect(summary().textContent).toContain('En el acto');
  });

  it('device-settings-E15: si el sistema pide no animar lo dice, y el resumen dice «En el acto»', () => {
    openSettings({ reduced: true });
    expect(screen.getByRole('note').textContent).toContain('ya pide no animar');
    expect(animations().getAttribute('aria-checked')).toBe('true');
    expect(summary().textContent).toContain('En el acto');
  });

  it('device-settings-E35: con el sistema pidiendo no animar se apaga la llave; cuando deja de pedirlo, sigue sin animaciones', () => {
    let reduce = true;
    const media = stubMedia((query) => !query.includes('max-width') && reduce);
    const stopMotion = watchMotion();
    fakeServer({ '/api/me/devices': 'waiting' });
    act(() => person.set(juan));
    navigate('/device-settings');
    open({ who: juan, screens: { deviceSettings: Settings } });
    fireEvent.click(animations());
    expect(animations().getAttribute('aria-checked')).toBe('false');
    reduce = false;
    act(() => media.changed());
    expect(screen.queryByRole('note')).toBeNull();
    expect(still()).toBe(true);
    expect(summary().textContent).toContain('En el acto');
    stopMotion();
  });

  it('device-settings-E16, E17, E18: dos formatos, cada uno con la hora de ahora; elegir cambia toda hora', () => {
    vi.useFakeTimers({ now: Date.UTC(2026, 10, 6, 17, 5), toFake: ['Date'] });
    openSettings();
    const [h24, h12] = [...document.querySelectorAll<HTMLElement>('.settings-format')] as [
      HTMLElement,
      HTMLElement,
    ];
    expect(h24.getAttribute('aria-pressed')).toBe('true');
    expect(h24.textContent).toContain('14:05');
    expect(h12.textContent?.replace(/\s/g, ' ')).toContain('2:05 p. m.');
    fireEvent.click(h12);
    expect(timeFormat.get()).toBe('h12');
    expect(h12.getAttribute('aria-pressed')).toBe('true');
    // E18: las horas de la aplicación pasan a a. m./p. m. sin recargar.
    expect(document.querySelector('.settings-seen')?.textContent?.replace(/\s/g, ' ')).toContain(
      'Quién hizo qué · 2:05 p. m.',
    );
    expect(summary().textContent?.replace(/\s/g, ' ')).toContain('2:05 p. m.');
    vi.useRealTimers();
  });

  it('device-settings-E11: Alt D cambia las animaciones, Alt H pasa al otro formato y Alt O vuelve a como viene', () => {
    openSettings();
    const stopKeys = startKeyboard();
    const alt = (key: string) =>
      act(() => {
        dispatchEvent(
          new KeyboardEvent('keydown', { key, code: `Key${key.toUpperCase()}`, altKey: true }),
        );
      });
    alt('d');
    expect(animations().getAttribute('aria-checked')).toBe('false');
    alt('h');
    expect(timeFormat.get()).toBe('h12');
    alt('h');
    expect(timeFormat.get()).toBe('h24');
    alt('o');
    expect(animations().getAttribute('aria-checked')).toBe('true');
    stopKeys();
  });

  it('device-settings-E34: «Volver a como viene» solo si algo cambió', () => {
    openSettings();
    expect(screen.queryByRole('button', { name: /Volver a como viene/ })).toBeNull();
    fireEvent.click(animations());
    fireEvent.click(screen.getByRole('button', { name: /Volver a como viene/ }));
    expect(animations().getAttribute('aria-checked')).toBe('true');
    expect(screen.queryByRole('button', { name: /Volver a como viene/ })).toBeNull();
    expect(screen.getByText('Volvió a como viene')).toBeTruthy();
  });

  it('las pastillas de «Así la tenés» llevan a su renglón', () => {
    openSettings();
    const scrolled = vi.fn();
    (document.getElementById('settings-time') as HTMLElement).scrollIntoView = scrolled;
    fireEvent.click(within(summary()).getAllByRole('button')[1] as HTMLElement);
    expect(scrolled).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    // device-settings-E13: sin animaciones, de golpe.
    fireEvent.click(animations());
    fireEvent.click(within(summary()).getAllByRole('button')[1] as HTMLElement);
    expect(scrolled).toHaveBeenLastCalledWith({ behavior: 'auto', block: 'center' });
  });

  it('device-settings-E20 a E23: el renglón de instalar, según lo que sabe el navegador', async () => {
    openSettings();
    expect(document.getElementById('settings-install')).toBeNull();
    act(() => installState.set('can'));
    expect(screen.getByRole('button', { name: /Instalar/ })).toBeTruthy();
    expect(summary().textContent).toContain('En el navegador');
    act(() => installState.set('installed'));
    expect(screen.getByText('Ya está instalada')).toBeTruthy();
    expect(summary().textContent).toContain('Instalada');
    act(() => installState.set('ios'));
    expect(screen.getByText('Tocá Compartir y después Agregar a inicio')).toBeTruthy();
    act(() => installState.set('installed-here'));
    await waitFor(() => expect(document.getElementById('settings-install')).toBeNull());
  });

  it('device-settings-E31: en la computadora no está «Trabajar sin conexión»', () => {
    openSettings();
    expect(screen.queryByRole('switch', { name: /Trabajar sin conexión/ })).toBeNull();
  });

  it('device-settings-E28: en el celular con la huella, la llave y su pastilla', () => {
    openSettings({ phone: true, who: { ...juan, offline: true } as typeof juan });
    const row = screen.getByRole('switch', { name: /Trabajar sin conexión/ });
    expect(row.hasAttribute('disabled')).toBe(false);
    expect(summary().textContent).toContain('Solo con internet');
    fireEvent.click(row);
    expect(row.getAttribute('aria-checked')).toBe('true');
    expect(row.textContent).toContain('aunque no haya internet, hasta 24 h');
    expect(summary().textContent).toContain('También sin conexión');
    // E33: «Volver a como viene» deja lo de arranque y no toca «Trabajar sin conexión».
    fireEvent.click(animations());
    fireEvent.click(screen.getByRole('button', { name: /Como viene/ }));
    expect(animations().getAttribute('aria-checked')).toBe('true');
    expect(timeFormat.get()).toBe('h24');
    expect(row.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(row);
  });

  it('device-settings-E07, E08, E09: con el espejo viaja ir a Configuración, pero no sus valores; nada va al servidor', () => {
    const sent: Patch[] = [];
    mirror.attach({ send: (patches) => sent.push(...patches), leader: true, over: 'direct' });
    const stopRoute = bindRoute(mirror, () => true);
    const fetched = vi.spyOn(globalThis, 'fetch');
    openSettings();
    expect(
      sent.some(
        (patch) =>
          patch.k === 'frame.route' && JSON.stringify(patch.v).includes('/device-settings'),
      ),
    ).toBe(true);
    sent.length = 0;
    fetched.mockClear();
    fireEvent.click(animations());
    fireEvent.click(document.querySelectorAll<HTMLElement>('.settings-format')[1] as HTMLElement);
    fireEvent.click(screen.getByRole('button', { name: /Volver a como viene/ }));
    expect(sent).toEqual([]);
    expect(fetched).not.toHaveBeenCalled();
    stopRoute();
    mirror.detach();
  });

  it('device-settings-E30: en el celular sin la huella, apagada y dice por qué', () => {
    openSettings({ phone: true });
    const row = screen.getByRole('switch', { name: /Trabajar sin conexión/ });
    expect(row.hasAttribute('disabled')).toBe(true);
    expect(row.textContent).toContain('primero vinculá tu huella');
  });
});
