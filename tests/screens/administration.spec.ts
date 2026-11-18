// Más → Administración (capítulo 06), tal como quedó aprobada, en la computadora y en el celular, y la
// confirmación del redondeo encima de la pantalla: que se vea entera y que el toque le llegue.
import { expect, type Page, test } from '@playwright/test';
import { administrator } from './person.ts';

const ana = { userId: 'u1', name: 'Ana Gómez', email: 'ana@example.com', ...administrator };
const now = new Date('2026-11-06T17:05:00Z');

const settings = {
  settings: {
    roundingStep: { value: 100_000, version: 0 },
    quickMargins: { value: [300, 200, 100, 50, 25], version: 0 },
    sessionIdle: { value: 60, version: 0 },
    sessionMax: { value: 8, version: 0 },
    pairingDays: { value: 30, version: 0 },
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

async function signedIn(page: Page) {
  await page.addInitScript((saved) => localStorage.setItem('session', JSON.stringify(saved)), {
    sessionId: 's',
    person: ana,
  });
  await page.route('**/api/start', async (route) => {
    const start = await (await route.fetch()).json();
    await route.fulfill({
      json: { ...start, person: ana },
      headers: { 'X-Ferrebress': `v=screens; t=${now.getTime()}; e=testing` },
    });
  });
  await page.route('**/api/administration', (route) => route.fulfill({ json: settings }));
  await page.route('**/api/administration/rounding', (route) => route.fulfill({ json: rounding }));
  await page.route('**/api/administration/settings/roundingStep', (route) =>
    route.fulfill({ status: 409, json: { error: 'confirm-prices', prices: 1650 } }),
  );
  await page.clock.setFixedTime(now);
}

test('administration: Administración en la computadora', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await signedIn(page);
  await page.goto('/administration');
  await expect(page.getByText('3.486 precios')).toBeVisible();
  await expect(page).toHaveScreenshot('administration-desktop.png');
});

test('administration: Administración en el celular', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signedIn(page);
  await page.goto('/administration');
  await expect(page.getByText('3.486 precios')).toBeVisible();
  await expect(page).toHaveScreenshot('administration-phone.png');
});

test('administration-E18: la confirmación del redondeo se ve encima y el toque le llega', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await signedIn(page);
  await page.goto('/administration');
  await page.getByRole('button', { name: /\$ 500(?![.,\d])/ }).click();
  const confirm = page.getByRole('alertdialog');
  await expect(confirm).toBeVisible();
  await expect(page).toHaveScreenshot('administration-confirm-desktop.png');
  await confirm.getByRole('button', { name: /Cancelar/ }).click();
  await expect(confirm).toBeHidden();
});
