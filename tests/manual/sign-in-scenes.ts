// Las escenas de «Entrar» que no son la entrada sola: la sesión que vence encima de lo que se
// estaba haciendo y el celular que pregunta si entra la computadora.

import { expect, type Page } from '@playwright/test';
import type { ReadCodeResponse } from '../../src/shared/contracts/sign-in.ts';
import { ana, answerStart, header, type Scene, signedIn } from './scenes.ts';

const read: ReadCodeResponse = {
  secret: 'captura',
  computer: { label: 'Chrome en Windows' },
  holdSeconds: 60,
  authentication: {},
};

const expired = (page: Page) => page.getByText('Tu sesión venció');

export const signInScenes: Scene[] = [
  {
    name: 'desktop-session-expired',
    device: 'computer',
    prepare: async (page) => {
      await signedIn(page, ana);
      // El próximo pedido llega con la sesión vencida por no usarla (01 · R3.1).
      await page.route('**/api/users/*/access', (route) =>
        route.fulfill({
          status: 401,
          json: { error: 'session-closed', reason: 'idle' },
          headers: header(),
        }),
      );
      // Y el servidor ya no la conoce: al pedir la entrada de nuevo, contesta sin persona.
      await answerStart(page);
      await page.locator('.users-row', { hasText: 'Lucía Fernández' }).dispatchEvent('click');
      await expect(expired(page)).toBeVisible();
      await expect(page.locator('.google[data-drawn] iframe')).toBeVisible();
    },
    points: { notice: expired },
  },
  {
    name: 'phone-link-confirm',
    device: 'phone',
    prepare: async (page) => {
      await page.addInitScript(() => localStorage.setItem('passkey', 'true'));
      await answerStart(page);
      await page.route('**/api/sign-in/codes/read', (route) =>
        route.fulfill({ json: read, headers: header() }),
      );
      await page.goto('/link#captura-fija');
      await expect(page.getByText('¿Entrar en Chrome en Windows?')).toBeVisible();
      // Debajo de la hoja está la entrada: que el botón de Google ya esté dibujado.
      await expect(page.locator('.google[data-drawn] iframe')).toBeVisible();
    },
    points: { yes: (page) => page.getByRole('button', { name: /Sí, entrar con la huella/ }) },
  },
];
