// Graba el clip «Entrar con el celular» (diseño del manual, § 3): una sola página con la computadora y
// el celular uno al lado del otro, cada uno con la aplicación en su marco, así sale un solo video sin
// dos que se desfasen. El guion recorre pantallas de verdad: la entrada de la computadora con su
// código, el celular que lo lee y pregunta «¿Entrar en Chrome en Windows?», y la computadora que
// entra. Guarda el video mudo y su último cuadro. Con MANUAL_CHECK=1 no corre: un video no sale igual
// dos veces.
import { copyFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, type Frame, type Page, test } from '@playwright/test';
import type { ReadCodeResponse } from '../../src/shared/contracts/sign-in.ts';
import { closedContext, mediaDir, toWebp } from './media.ts';
import { ana, header, now, start } from './scenes.ts';

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

test(name, async ({ browser, baseURL }) => {
  test.skip(process.env.MANUAL_CHECK === '1', 'un video no sale igual dos veces');
  const videos = mkdtempSync(join(tmpdir(), 'ferrebress-clip-'));
  const { context, escaped } = await closedContext(browser, baseURL as string, {
    viewport: size,
    recordVideo: { dir: videos, size },
  });
  // El marco del celular se presenta como celular.
  await context.addInitScript(() => {
    if (window.name === 'phone')
      Object.defineProperty(navigator, 'userAgentData', { get: () => ({ mobile: true }) });
  });
  let entered = false;
  await context.route('**/api/start', (route) => {
    const computer = route.request().frame().name() === 'computer';
    route.fulfill({ json: start(computer && entered ? ana : undefined), headers: header() });
  });
  await context.route('**/api/sign-in/codes/read', (route) =>
    route.fulfill({ json: read, headers: header() }),
  );
  const page = await context.newPage();
  await page.clock.setFixedTime(now);
  await page.setContent(stage(baseURL as string));
  const computer = frameOf(page, 'computer');
  const phone = frameOf(page, 'phone');
  await expect(computer.locator('.qr > svg > path')).toBeVisible();
  await expect(phone.locator('.google[data-drawn] iframe')).toBeVisible();
  await page.waitForTimeout(1500);
  await phone.goto(`${baseURL}/link#captura-fija`);
  await expect(phone.getByText('¿Entrar en Chrome en Windows?')).toBeVisible();
  await page.waitForTimeout(2500);
  entered = true;
  await computer.goto(`${baseURL}/`);
  await expect(computer.getByText(ana.name)).toBeVisible();
  await page.waitForTimeout(2500);
  const last = await page.screenshot();
  expect(escaped, 'pedidos fuera del servidor de mentira').toEqual([]);
  const video = page.video();
  await context.close();
  copyFileSync((await video?.path()) as string, join(mediaDir, `${name}.webm`));
  const converter = await browser.newPage();
  writeFileSync(join(mediaDir, `${name}.end.webp`), await toWebp(converter, last, 960));
  await converter.close();
});
