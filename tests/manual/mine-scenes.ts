// Las escenas de lo tuyo en Configuración para su capítulo del manual (04, etapa b): este
// dispositivo con su nombre, el campo para ponérselo, la huella del celular, tus otros dispositivos,
// «Cerrar todas» y el recibo de «Se me perdió». Lo tuyo es el de las capturas de la pantalla
// (tests/screens/mine.ts), con las horas corridas al reloj del manual.
import { expect, type Page } from '@playwright/test';
import { mine } from '../screens/mine.ts';
import { settled } from './device-settings-scenes.ts';
import { ana, now, type Scene, signedIn } from './scenes.ts';
import { button, shown } from './users-scenes.ts';

// Las horas de lo tuyo están armadas para el reloj de las capturas de la pantalla.
const screensNow = new Date('2026-11-06T17:05:00Z').getTime();
const timed = new Set(['createdAt', 'lastUsedAt']);
function shifted<T>(value: T): T {
  if (Array.isArray(value)) return value.map(shifted) as T;
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, field]) => [
      key,
      timed.has(key) ? (field as number) - screensNow + now.getTime() : shifted(field),
    ]),
  ) as T;
}

type Mine = ReturnType<typeof mine>;
type Change = (data: Mine) => Mine;

// Configuración abierta, con lo tuyo; después de cortar, el servidor contesta lo de ahora.
async function opened(page: Page, change: Change = (data) => data): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await signedIn(page, ana);
  const isPhone = /Android|iPhone/.test(await page.evaluate(() => navigator.userAgent));
  let data = change(shifted(mine(isPhone)));
  await page.route('**/api/me/devices', (route) => route.fulfill({ json: data }));
  await page.route('**/api/me/devices/*/cut', (route) => {
    data = { ...data, others: data.others.slice(1) };
    return route.fulfill({ json: { sessions: 2, passkey: true } });
  });
  await page.goto('/device-settings');
  await expect(page.locator('.mine-device')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await settled(page);
}

// Lo que entra con un movimiento que queda puesto al terminar (el recibo, el diálogo): se espera
// que termine.
const still = (page: Page) =>
  page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (one) => one.playState === 'finished' || one.effect?.getTiming().iterations === Infinity,
      ),
  );

const top = async (page: Page) => {
  await page.locator('.settings').evaluate((screen) => screen.scrollTo(0, 0));
  await settled(page);
};

// En el celular, tus otros dispositivos están debajo de este: se baja hasta ellos. En la computadora
// están al lado, a la vista desde arriba.
const others = async (page: Page) => {
  const isPhone = /Android|iPhone/.test(await page.evaluate(() => navigator.userAgent));
  if (isPhone)
    await page
      .locator('.mine-others')
      .evaluate((block) => block.scrollIntoView({ block: 'start' }));
  else await page.locator('.settings').evaluate((screen) => screen.scrollTo(0, 0));
  await page.mouse.move(0, 0);
};

async function here(page: Page): Promise<void> {
  await opened(page);
  await top(page);
}

// El campo abierto, con la primera idea elegida.
async function naming(page: Page): Promise<void> {
  await opened(page);
  await page.locator('.mine-name .button').first().click();
  await page.locator('.mine-idea').first().click();
  await expect(page.locator('.mine-name-edit input')).not.toHaveValue('');
  await top(page);
}

// Un celular sin huella: ofrece vincularla.
async function noPasskey(page: Page): Promise<void> {
  await opened(page, ({ here: { since: _, ...here }, ...data }) => ({
    ...data,
    // Sin huella no hizo entrar a ninguna computadora.
    here: { ...here, passkey: 'none', computers: [] } as Mine['here'],
  }));
  await top(page);
}

async function list(page: Page): Promise<void> {
  await opened(page);
  await others(page);
  await settled(page);
}

async function closeAll(page: Page): Promise<void> {
  await list(page);
  await button('Cerrar todas')(page).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await still(page);
}

// «Se me perdió» en el celular de Rubén: en la computadora se corta al tocarlo; en el celular, al
// soltar el dedo.
async function lost(page: Page): Promise<void> {
  await list(page);
  const lost = button('Se me perdió')(page);
  if (/Android|iPhone/.test(await page.evaluate(() => navigator.userAgent))) await lost.tap();
  else await lost.click();
  await expect(page.locator('.mine-receipt')).toBeVisible();
  await still(page);
  await others(page);
}

const name = (page: Page) => shown(page.locator('.mine-name .button').first());
const remove = (page: Page) => shown(page.locator('.mine-passkey .button'));
const link = button('Vincular este celular con mi huella');
const field = (page: Page) => page.locator('.mine-name-edit input');
const ideas = (page: Page) => page.locator('.mine-ideas');
const done = (page: Page) => page.locator('.mine-name-edit button[type="submit"]');
const close = (page: Page) => page.locator('.mine-family .mine-chip .mine-x').first();
const lostButton = button('Se me perdió');
const all = button('Cerrar todas');
const yes = (page: Page) =>
  page.getByRole('alertdialog').getByRole('button', { name: /^Cerrar las/ });
const receipt = (page: Page) => page.locator('.mine-receipt');

export const mineScenes: Scene[] = [
  {
    name: 'desktop-mine',
    device: 'computer',
    prepare: here,
    points: { name, all, close, lost: lostButton },
  },
  {
    name: 'desktop-mine-naming',
    device: 'computer',
    prepare: naming,
    points: { field, ideas, done },
  },
  {
    name: 'desktop-mine-close-all',
    device: 'computer',
    prepare: closeAll,
    points: { yes: yes },
  },
  { name: 'desktop-mine-lost', device: 'computer', prepare: lost, points: { receipt } },
  { name: 'phone-mine', device: 'phone', prepare: here, points: { name, remove } },
  { name: 'phone-mine-naming', device: 'phone', prepare: naming, points: { field, ideas, done } },
  { name: 'phone-mine-no-passkey', device: 'phone', prepare: noPasskey, points: { link } },
  {
    name: 'phone-mine-others',
    device: 'phone',
    prepare: list,
    points: { all, close, lost: lostButton },
  },
  { name: 'phone-mine-lost', device: 'phone', prepare: lost, points: { receipt } },
];
