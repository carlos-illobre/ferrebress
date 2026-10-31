// Graba el clip «Entrar con el celular» (diseño del manual, § 3): una sola página con la computadora y
// el celular uno al lado del otro, cada uno con la aplicación en su marco, así sale un solo video sin
// dos que se desfasen. El guion recorre pantallas de verdad: la entrada de la computadora con su
// código, el celular que lo lee y pregunta «¿Entrar en Chrome en Windows?», y la computadora que
// entra. Guarda el video mudo y su último cuadro. Con MANUAL_CHECK=1 no corre: un video no sale igual
// dos veces.
import { copyFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { type Browser, expect, type Frame, type Page, test } from '@playwright/test';
import type { ReadCodeResponse } from '../../src/shared/contracts/sign-in.ts';
import { closedContext, expectClean, mediaDir, toWebp } from './media.ts';
import { ana, answerUsers, header, now, start } from './scenes.ts';

const name = 'phone-to-computer';
const size = { width: 1280, height: 720 };

const stage = (base: string) => `<!doctype html>
<html><body style="margin:0;width:1280px;height:720px;background:#12382f;overflow:hidden">
<iframe name="computer" src="${base}/" style="position:absolute;left:48px;top:140px;width:1366px;height:768px;border:0;border-radius:10px;transform:scale(.62);transform-origin:0 0"></iframe>
<iframe name="phone" src="${base}/" style="position:absolute;left:960px;top:80px;width:390px;height:844px;border:0;border-radius:28px;outline:6px solid #0b0d0c;transform:scale(.66);transform-origin:0 0"></iframe>
</body></html>`;

const read: ReadCodeResponse = {
  secret: 'captura',
  computer: { label: 'Chrome en Windows' },
  holdSeconds: 60,
  authentication: {},
};

const frameOf = (page: Page, wanted: string) =>
  page.frames().find((frame) => frame.name() === wanted) as Frame;

// Un contexto que graba, con el celular que ya entra con la huella (01 · R2.4) y las respuestas del
// guion: la computadora entra recién cuando `scene.entered`.
async function recording(browser: Browser, baseURL: string, scene: { entered: boolean }) {
  const videos = mkdtempSync(join(tmpdir(), 'ferrebress-clip-'));
  const closed = await closedContext(browser, baseURL, {
    viewport: size,
    recordVideo: { dir: videos, size },
  });
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
  await expect(computer.getByText(ana.name)).toBeVisible();
  await page.waitForTimeout(2500);
}

test(name, async ({ browser, baseURL }) => {
  test.skip(process.env.MANUAL_CHECK === '1', 'un video no sale igual dos veces');
  const base = baseURL as string;
  const scene = { entered: false };
  const { context, escaped } = await recording(browser, base, scene);
  const page = await context.newPage();
  await page.clock.setFixedTime(now);
  // La escena se sirve desde el mismo servidor: los marcos con la aplicación necesitan una página
  // segura alrededor (crypto.randomUUID, la huella).
  await page.route('**/clip-stage', (route) =>
    route.fulfill({ contentType: 'text/html', body: stage(base) }),
  );
  await page.goto('/clip-stage');
  await play(page, base, scene);
  for (const frame of page.frames()) await expectClean(frame);
  const last = await page.screenshot();
  expect(escaped, 'pedidos fuera del servidor de mentira').toEqual([]);
  const video = page.video();
  await context.close();
  copyFileSync((await video?.path()) as string, join(mediaDir, `${name}.webm`));
  // El último cuadro se pasa a WebP también en un contexto encerrado.
  const quiet = await closedContext(browser, base, {});
  writeFileSync(
    join(mediaDir, `${name}.end.webp`),
    await toWebp(await quiet.context.newPage(), last, 960),
  );
  await quiet.context.close();
});
