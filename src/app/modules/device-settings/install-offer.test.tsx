import { act, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { installState, watchInstall } from '../../platform/install.ts';
import { stubMedia } from '../../testing/media.ts';
import { administrator } from '../../testing/person.ts';
import { Toasts } from '../../ui/toast/Toast.tsx';
import { offerPasskey, person } from '../sign-in/index.ts';
import { InstallOffer } from './index.ts';
import { deviceSettingsSettings } from './settings.ts';
import { installHere } from './useSettings.ts';

const ana = { userId: 'ana', name: 'Ana', email: 'ana@example.com', ...administrator };

// El navegador dice que se puede instalar; contesta lo que diga la prueba.
function browserOffers(outcome: 'accepted' | 'dismissed') {
  const event = new Event('beforeinstallprompt', { cancelable: true }) as Event &
    Record<string, unknown>;
  event.prompt = () => Promise.resolve();
  event.userChoice = Promise.resolve({ outcome });
  act(() => {
    dispatchEvent(event);
  });
}

function arrive({ phone = true, testing = false } = {}) {
  stubMedia(() => phone);
  vi.stubGlobal('navigator', { ...navigator, userAgent: phone ? 'Android' : 'Windows' });
  render(
    <>
      <InstallOffer testing={testing} />
      <Toasts />
    </>,
  );
  act(() => person.set(ana));
}

const sheet = () => screen.queryByRole('dialog', { name: /Instalá Ferrebress/ });
const wait = () =>
  act(() => {
    vi.advanceTimersByTime(deviceSettingsSettings.offerAfterMs);
  });

describe('el aviso para instalar', () => {
  beforeAll(() => watchInstall());
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });
  afterEach(() => {
    act(() => {
      person.set(undefined);
      offerPasskey.set(false);
      installState.set('cannot');
    });
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('device-settings-E25: en el celular aparece una vez; «Ahora no» lo cierra y no vuelve, entre quien entre', async () => {
    browserOffers('dismissed');
    arrive();
    wait();
    await waitFor(() => expect(sheet()).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Ahora no' }));
    expect(sheet()).toBeNull();
    expect(screen.getByText('Si cambiás de idea, está en Más → Configuración')).toBeTruthy();
    act(() => person.set({ ...ana, userId: 'beto' }));
    wait();
    expect(sheet()).toBeNull();
  });

  it('device-settings-E26: «Instalar» y el navegador acepta: se cierra y queda instalada', async () => {
    browserOffers('accepted');
    arrive();
    wait();
    await waitFor(() => expect(sheet()).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /^Instalar/ }));
    await waitFor(() => expect(sheet()).toBeNull());
    expect(installState.get()).toBe('installed');
    expect(screen.getByText('Listo: Ferrebress quedó con su ícono')).toBeTruthy();
  });

  it('device-settings-E36: «Instalar» y se cancela en el navegador: cuenta como cerrado', async () => {
    browserOffers('dismissed');
    arrive();
    wait();
    await waitFor(() => expect(sheet()).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /^Instalar/ }));
    await waitFor(() => expect(sheet()).toBeNull());
    expect(screen.getByText('Si cambiás de idea, está en Más → Configuración')).toBeTruthy();
    expect(localStorage.getItem('install-offered')).toBe('true');
  });

  it('device-settings-E27: en la computadora no aparece', () => {
    browserOffers('accepted');
    arrive({ phone: false });
    wait();
    expect(sheet()).toBeNull();
  });

  it('device-settings-E39: en el ambiente de pruebas no aparece', () => {
    browserOffers('accepted');
    arrive({ testing: true });
    wait();
    expect(sheet()).toBeNull();
  });

  it('device-settings-E38: con el ofrecimiento de la huella abierto espera, y aparece al cerrarlo', async () => {
    browserOffers('accepted');
    act(() => offerPasskey.set(true));
    arrive();
    wait();
    expect(sheet()).toBeNull();
    act(() => offerPasskey.set(false));
    wait();
    await waitFor(() => expect(sheet()).toBeTruthy());
  });

  it('device-settings-E20: instalar desde Configuración lo confirma; si no queda, nada', async () => {
    render(<Toasts />);
    const vibrate = vi.fn();
    vi.stubGlobal('navigator', { ...navigator, vibrate });
    browserOffers('dismissed');
    await installHere();
    expect(vibrate).not.toHaveBeenCalled();
    browserOffers('accepted');
    await installHere();
    expect(vibrate).toHaveBeenCalledOnce();
    expect(screen.getByText('Listo: Ferrebress quedó con su ícono')).toBeTruthy();
  });
});
