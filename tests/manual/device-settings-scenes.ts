// Las escenas de Configuración para su capítulo del manual (capítulo 04): la pantalla en la
// computadora y en el celular, con algo cambiado para que se vea «Volver a como viene», y el aviso
// para instalar del celular. Que el navegador sabe instalar se simula, como en las capturas.
import { expect, type Page } from '@playwright/test';
import { mine } from '../screens/mine.ts';
import { ana, type Scene, signedIn } from './scenes.ts';
import { button, shown } from './users-scenes.ts';

const browserOffers = (page: Page) =>
  page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    Object.assign(event, {
      prompt: () => Promise.resolve(),
      userChoice: Promise.resolve({ outcome: 'dismissed' }),
    });
    dispatchEvent(event);
  });

// Quieta, salvo la espera de muestra, que gira siempre (04 · R2.2).
const settled = (page: Page) =>
  page.waitForFunction(() =>
    document.getAnimations().every((one) => one.effect?.getTiming().iterations === Infinity),
  );

// Configuración abierta, con el renglón de instalar.
// Sin «reducir movimiento» del sistema, que agregaría su aviso a la pantalla: así la ve casi todo el mundo.
async function settings(page: Page, person = ana): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await signedIn(page, person);
  // Lo mío, como en la maqueta: este dispositivo y los otros (04 · R1.8).
  await page.route('**/api/me/devices', (route) =>
    route.fulfill({
      json: mine(/Android|iPhone/.test(route.request().headers()['user-agent'] ?? '')),
    }),
  );
  await page.goto('/device-settings');
  await expect(page.getByRole('heading', { name: 'Configuración' })).toBeVisible();
  await browserOffers(page);
  await page.evaluate(() => document.fonts.ready);
  await settled(page);
}

// Con las animaciones apagadas y a. m./p. m.: aparece «Volver a como viene».
async function changed(page: Page): Promise<void> {
  await settings(page);
  const animations = page.getByRole('switch', { name: /Animaciones/ });
  await animations.click();
  await expect(animations).toHaveAttribute('aria-checked', 'false');
  await page.locator('.settings-format').nth(1).click();
  await expect(button(/Volver a como viene|Como viene/)(page)).toBeVisible();
  await page.mouse.move(0, 0);
  // Arriba, donde están «Así la tenés» y «Volver a como viene».
  await page.locator('.settings').evaluate((screen) => screen.scrollTo(0, 0));
  await settled(page);
}

// Las preferencias de este dispositivo, debajo de su dibujo, a la vista.
async function preferences(page: Page): Promise<void> {
  await settings(page);
  await page.locator('.mine-prefs').evaluate((block) => block.scrollIntoView({ block: 'start' }));
  await settled(page);
}

// El aviso para instalar, al llegar al marco en el celular.
async function offer(page: Page): Promise<void> {
  await signedIn(page, ana);
  await browserOffers(page);
  await expect(page.getByRole('dialog', { name: /Instalá Ferrebress/ })).toBeVisible();
  await settled(page);
}

const animations = (page: Page) => shown(page.getByRole('switch', { name: /Animaciones/ }));
const formats = (page: Page) => shown(page.locator('.settings-formats'));
const install = (page: Page) => shown(page.locator('#settings-install'));
const summary = (page: Page) => shown(page.locator('.settings-chips'));
const reset = (page: Page) => button(/Volver a como viene|Como viene/)(page);

export const deviceSettingsScenes: Scene[] = [
  {
    name: 'desktop-settings',
    device: 'computer',
    prepare: preferences,
    points: { animations, formats, install },
  },
  {
    name: 'desktop-settings-changed',
    device: 'computer',
    prepare: changed,
    points: { summary, reset },
  },
  {
    name: 'phone-settings',
    device: 'phone',
    prepare: preferences,
    points: { animations, formats, install },
  },
  {
    name: 'phone-settings-changed',
    device: 'phone',
    prepare: changed,
    points: { summary, reset },
  },
  {
    name: 'phone-install-offer',
    device: 'phone',
    prepare: offer,
    points: {
      install: (page) => page.getByRole('dialog').getByRole('button', { name: /^Instalar/ }),
      later: (page) => page.getByRole('button', { name: 'Ahora no' }),
    },
  },
];
