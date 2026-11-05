// Graba el clip «Entrar con el celular» (diseño del manual, § 3), con la computadora y el celular uno
// al lado del otro (stage.ts). El guion recorre pantallas de verdad: la entrada de la computadora con
// su código, el celular que lo lee y pregunta «¿Entrar en Chrome en Windows?», y la computadora que
// entra.
import { type Browser, expect, type Page } from '@playwright/test';
import type { ReadCodeResponse } from '../../src/shared/contracts/sign-in.ts';
import { ana, answerUsers, header, start } from './scenes.ts';
import { clip, frameOf, recording as stageRecording } from './stage.ts';

const name = 'phone-to-computer';

const read: ReadCodeResponse = {
  secret: 'captura',
  computer: { label: 'Chrome en Windows' },
  holdSeconds: 60,
  authentication: {},
};

// Un contexto que graba, con el celular que ya entra con la huella (01 · R2.4) y las respuestas del
// guion: la computadora entra recién cuando `scene.entered`.
async function recording(browser: Browser, baseURL: string, scene: { entered: boolean }) {
  const closed = await stageRecording(browser, baseURL);
  await closed.context.addInitScript(() => {
    if (window.name !== 'phone') return;
    Object.defineProperty(navigator, 'userAgentData', { get: () => ({ mobile: true }) });
    localStorage.setItem('passkey', 'true');
  });
  await closed.context.route('**/api/start', (route) => {
    const computer = route.request().frame().name() === 'computer';
    route.fulfill({ json: start(computer && scene.entered ? ana : undefined), headers: header() });
  });
  await closed.context.route('**/api/sign-in/codes/read', (route) =>
    route.fulfill({ json: read, headers: header() }),
  );
  // La computadora que entró abre Usuarios, la primera opción del menú.
  await answerUsers(closed.context, ana);
  return closed;
}

// El guion: la entrada con su código, el celular que lo lee y pregunta, la computadora que entra.
async function play(page: Page, baseURL: string, scene: { entered: boolean }): Promise<void> {
  const computer = frameOf(page, 'computer');
  const phone = frameOf(page, 'phone');
  await expect(computer.locator('.qr > svg > path')).toBeVisible();
  await expect(phone.locator('.google[data-drawn] iframe')).toBeVisible();
  await page.waitForTimeout(1500);
  await phone.goto(`${baseURL}/link#captura-fija`);
  await expect(phone.getByText('¿Entrar en Chrome en Windows?')).toBeVisible();
  await page.waitForTimeout(2500);
  scene.entered = true;
  await computer.goto(`${baseURL}/`);
  await expect(computer.getByLabel('Tu sesión').getByText(ana.name)).toBeVisible();
  await page.waitForTimeout(2500);
}

const scene = { entered: false };

clip({
  name,
  prepare: (browser, baseURL) => recording(browser, baseURL, scene),
  play: (page, baseURL) => play(page, baseURL, scene),
});
