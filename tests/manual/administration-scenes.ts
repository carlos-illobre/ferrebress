// Las escenas de Administración para su capítulo del manual (capítulo 06): cada ajuste en la
// computadora, la confirmación del redondeo, el aviso con «Deshacer» y la pantalla en el celular. Los
// precios son de ejemplo, como en la maqueta.
import { expect, type Page } from '@playwright/test';
import { ana, type Scene, signedIn } from './scenes.ts';
import { button, shown } from './users-scenes.ts';

const settings = {
  settings: {
    roundingStep: { value: 100_000, version: 3 },
    quickMargins: { value: [300, 200, 100, 50, 25], version: 1 },
    sessionIdle: { value: 60, version: 0 },
    sessionMax: { value: 8, version: 0 },
    pairingDays: { value: 30, version: 2 },
    offlineHours: { value: 24, version: 0 },
    googleAttempts: { value: 10, version: 0 },
    passkeyAttempts: { value: 20, version: 0 },
    failedAttempts: { value: 20, version: 0 },
    reviewPercent: { value: 50, version: 0 },
    goneWarnPercent: { value: 20, version: 0 },
    maxFileMb: { value: 30, version: 0 },
    confirmRows: { value: 200_000, version: 0 },
    filesMb: { value: 100, version: 0 },
    unappliedFileDays: { value: 30, version: 0 },
  },
  businessTimeZone: 'America/Argentina/Buenos_Aires',
};
const rounding = {
  total: 3486,
  changes: { 1: 3412, 1000: 3398, 5000: 3120, 10000: 2874, 50000: 1650, 500000: 3077 },
  examples: [
    { name: 'Martillo carpintero 27 mm', calculated: '1500100' },
    { name: 'Cinta métrica 5 m', calculated: '843700' },
    { name: 'Pinza universal 8"', calculated: '1264000' },
    { name: 'Tarugos S8 × 100', calculated: '321500' },
  ],
};

// Administración abierta, en el ajuste de esa tecla del menú.
async function open(page: Page, tab?: RegExp): Promise<void> {
  await page.route('**/api/administration', (route) => route.fulfill({ json: settings }));
  await page.route('**/api/administration/rounding', (route) => route.fulfill({ json: rounding }));
  await page.route('**/api/administration/settings/roundingStep', (route) =>
    route.fulfill({ status: 409, json: { error: 'confirm-prices', prices: 1650 } }),
  );
  await page.route('**/api/administration/settings/sessionIdle', (route) =>
    route.fulfill({ json: { value: 30, version: 1 } }),
  );
  await signedIn(page, ana);
  await page.goto('/administration');
  await expect(page.getByText('3.486 precios')).toBeVisible();
  if (tab) await page.getByRole('tab', { name: tab }).click();
  await page.mouse.move(0, 0);
}

const at = (tab?: RegExp) => (page: Page) => open(page, tab);

// Pasando por el paso de $ 500: el panel muestra cuántos precios cambian.
async function looking(page: Page): Promise<void> {
  await open(page);
  await page.getByRole('button', { name: /\$ 500/ }).hover();
  await expect(page.getByText('Cambian 1.650')).toBeVisible();
}

async function confirming(page: Page): Promise<void> {
  await open(page);
  await page.getByRole('button', { name: /\$ 500/ }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
}

async function saved(page: Page): Promise<void> {
  await open(page, /Sin uso/);
  await page.getByRole('button', { name: /^30 min/ }).click();
  await expect(page.locator('.toast')).toContainText('Deshacer');
}

const tab = (name: RegExp) => (page: Page) => shown(page.getByRole('tab', { name }));
const option = (name: RegExp) => (page: Page) =>
  shown(page.locator('.admin-option').filter({ hasText: name }));

export const administrationScenes: Scene[] = [
  {
    name: 'desktop-administration',
    device: 'computer',
    prepare: at(),
    points: { rounding: tab(/Redondeo/), steps: option(/\$ 500/) },
  },
  {
    name: 'desktop-administration-looking',
    device: 'computer',
    prepare: looking,
    points: { count: (page) => shown(page.locator('.admin-big')) },
  },
  {
    name: 'desktop-administration-confirm',
    device: 'computer',
    prepare: confirming,
    points: {
      confirm: (page) => page.getByRole('alertdialog').getByRole('button', { name: /Cambiar/ }),
    },
  },
  {
    name: 'desktop-administration-margins',
    device: 'computer',
    prepare: at(/Márgenes rápidos/),
    points: { margin: (page) => page.getByLabel('Margen de la tecla 3') },
  },
  {
    name: 'desktop-administration-session',
    device: 'computer',
    prepare: at(/Sin uso/),
    points: { idle: option(/^30 min/), day: (page) => shown(page.locator('.admin-day')) },
  },
  {
    name: 'desktop-administration-saved',
    device: 'computer',
    prepare: saved,
    points: { undo: button('Deshacer') },
  },
  {
    name: 'desktop-administration-pairing',
    device: 'computer',
    prepare: at(/Días del vínculo/),
    points: { days: (page) => page.getByRole('textbox', { name: 'Días del vínculo' }) },
  },
  {
    name: 'phone-administration',
    device: 'phone',
    prepare: at(),
    // En el celular la tira no lleva ícono: el aro va sobre su nombre.
    points: {
      strips: (page) => shown(page.locator('.admin-item span', { hasText: 'Márgenes rápidos' })),
      steps: option(/\$ 500/),
    },
  },
];
