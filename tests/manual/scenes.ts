// Las escenas de las capturas del manual (diseño del manual, § 3): cómo se arma cada pantalla con
// respuestas de mentira y qué señala cada punto. Siempre como en producción (sin el marco ni el
// cartel del ambiente de pruebas), con una persona inventada y el reloj fijo.

import { type BrowserContext, expect, type Locator, type Page } from '@playwright/test';
import type { Device } from '../../src/shared/contracts/manual.ts';
import type { Person, StartResponse } from '../../src/shared/contracts/sign-in.ts';

export type Scene = {
  name: string;
  device: Device;
  prepare: (page: Page, context: BrowserContext) => Promise<void>;
  points: Record<string, (page: Page) => Locator>;
};

export const now = new Date('2026-10-28T12:00:00-03:00');
export const ana: Person = {
  userId: 'u1',
  name: 'Ana Gómez',
  email: 'ana@example.com',
  role: 'Administrador',
};

// La cabecera del servidor, de producción.
// La hora del servidor, la misma del reloj fijo: lo que dice «hace…» no cambia de un día a otro.
export const header = () => ({ 'X-Ferrebress': `v=screens; t=${now.getTime()}; e=production` });

export const start = (person?: Person): StartResponse => ({
  environment: 'production',
  version: 'screens',
  googleClientId: 'screens',
  googleScriptUrl: '/google-button-screens.js',
  googleNonce: 'screens',
  ...(person && { person }),
});

// /api/start contesta como producción, con la persona si hay sesión guardada.
export async function answerStart(page: Page, person?: Person): Promise<void> {
  await page.route('**/api/start', (route) =>
    route.fulfill({ json: start(person), headers: header() }),
  );
}

// La lista de Usuarios, que el marco abre al entrar: la persona y dos más, inventadas.
const hour = 3_600_000;
const row = (id: string, name: string, lastSignInAt: number | null, self = false) => ({
  id,
  name,
  displayName: name,
  email: self ? ana.email : `${id}@example.com`,
  active: true,
  self,
  authorizedAt: now.getTime() - 900 * hour,
  authorizedBy: null,
  deactivatedAt: null,
  lastSignInAt,
  neverSignedIn: lastSignInAt === null,
  version: 1,
  sessions: lastSignInAt === null ? 0 : 1,
  phones: 0,
});

async function answerUsers(page: Page, person: Person): Promise<void> {
  const people = [
    row(person.userId, person.name, now.getTime() - 2 * hour, true),
    row('lucia', 'Lucía Fernández', now.getTime() - 50 * hour),
    row('pedro', 'Pedro Giménez', null),
  ];
  await page.route('**/api/users', (route) =>
    route.fulfill({ json: { people }, headers: header() }),
  );
}

async function signedIn(page: Page, person: Person): Promise<void> {
  await page.addInitScript((saved) => localStorage.setItem('session', JSON.stringify(saved)), {
    sessionId: 's',
    person,
  });
  await answerStart(page, person);
  await answerUsers(page, person);
  await page.goto('/');
  await page.locator('.users-row').first().waitFor({ state: 'attached' });
}

async function entrance(page: Page): Promise<void> {
  await answerStart(page);
  await page.goto('/');
  await expect(page.locator('.google[data-drawn] iframe')).toBeVisible();
}

const offlineNotice = (page: Page) => page.getByText('Para entrar hace falta internet');
const buttonIcon = (name: RegExp) => (page: Page) =>
  page.getByRole('button', { name }).locator('svg').first();

async function openMore(page: Page, person: Person): Promise<void> {
  await signedIn(page, person);
  await page.getByRole('button', { name: 'Más', exact: true }).click();
}

export const scenes: Scene[] = [
  {
    name: 'desktop-entrance',
    device: 'computer',
    prepare: async (page) => {
      await entrance(page);
      await expect(page.locator('.qr > svg > path')).toBeVisible();
    },
    points: { qr: (page) => page.locator('.qr'), google: (page) => page.locator('.google') },
  },
  {
    name: 'desktop-entrance-offline',
    device: 'computer',
    prepare: async (page, context) => {
      await entrance(page);
      await context.setOffline(true);
      await expect(offlineNotice(page)).toBeVisible();
    },
    points: { notice: offlineNotice },
  },
  {
    name: 'desktop-frame-sign-out',
    device: 'computer',
    prepare: async (page) => {
      await signedIn(page, ana);
      await expect(page.getByRole('button', { name: /Salir/ })).toBeVisible();
    },
    points: {
      card: (page) => page.getByRole('region', { name: 'Tu sesión' }),
      'sign-out': (page) => page.getByRole('button', { name: /Salir/ }),
    },
  },
  {
    name: 'phone-entrance',
    device: 'phone',
    prepare: entrance,
    points: {
      google: (page) => page.locator('.google'),
      fingerprint: buttonIcon(/Ingresar con huella/),
      scan: buttonIcon(/Escanear código QR/),
    },
  },
  {
    name: 'phone-google-offline',
    device: 'phone',
    prepare: async (page, context) => {
      await entrance(page);
      await context.setOffline(true);
      await expect(offlineNotice(page)).toBeVisible();
    },
    points: { notice: offlineNotice },
  },
  {
    name: 'phone-offline-finger',
    device: 'phone',
    prepare: async (page, context) => {
      const contact = now.getTime() - 3_600_000;
      await page.addInitScript(
        ({ at, person }) => {
          localStorage.setItem('offline-option', JSON.stringify({ person, revoked: false }));
          localStorage.setItem('offline-contact', JSON.stringify({ at, maxSeenAt: at }));
        },
        { at: contact, person: ana },
      );
      await entrance(page);
      await context.setOffline(true);
      await expect(page.getByText(/Sin conexión: podés entrar con la huella hasta/)).toBeVisible();
    },
    points: { until: (page) => page.getByText(/Sin conexión: podés entrar con la huella hasta/) },
  },
  {
    name: 'phone-not-confirmed',
    device: 'phone',
    prepare: async (page) => {
      await page.addInitScript(
        (person) =>
          localStorage.setItem(
            'session',
            JSON.stringify({ person, closedReason: 'offline-not-confirmed' }),
          ),
        ana,
      );
      await entrance(page);
      await expect(page.getByText('No se pudo confirmar tu entrada sin conexión')).toBeVisible();
    },
    points: { notice: (page) => page.getByText('No se pudo confirmar tu entrada sin conexión') },
  },
  {
    name: 'phone-more-offline',
    device: 'phone',
    prepare: async (page) => {
      await openMore(page, { ...ana, offline: true });
      const option = page.getByRole('switch', { name: 'Trabajar sin conexión' });
      await option.click();
      await expect(option).toHaveAttribute('aria-checked', 'true');
    },
    points: {
      offline: (page) =>
        page.getByRole('switch', { name: 'Trabajar sin conexión' }).locator('.switch'),
    },
  },
  {
    name: 'phone-more-sign-out',
    device: 'phone',
    prepare: async (page) => {
      await openMore(page, ana);
      // Hasta el final, siempre igual, y sin el foco del botón tocado: la captura sale idéntica.
      await page.locator('.phone-more').evaluate((more) => {
        more.scrollTop = more.scrollHeight;
        (document.activeElement as HTMLElement | null)?.blur();
      });
    },
    points: {
      more: (page) => page.getByRole('button', { name: 'Más', exact: true }),
      'sign-out': (page) => page.getByRole('button', { name: /Salir/ }).last(),
    },
  },
];
