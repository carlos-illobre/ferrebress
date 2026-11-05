// Graba el clip «Vincular el celular» (capítulo 03 del manual), con la computadora y el celular uno al
// lado del otro (stage.ts). El guion recorre pantallas de verdad: la computadora muestra el código, el
// celular lo lee con la cámara, quedan vinculados, se encuentran y se conectan directo; y lo que se
// toca en el celular se ve en la computadora. La conexión directa y la cámara son de mentira
// (device-link-fakes.ts); el directo pasa los mensajes de un marco al otro, así el espejo anda.
import { type Browser, expect, type Page } from '@playwright/test';
import { fakeCamera, fakeWebRtc } from './device-link-fakes.ts';
import { pairing } from './device-link-scenes.ts';
import { ana, answerUsers, header, start } from './scenes.ts';
import { clip, frameOf, recording } from './stage.ts';

const name = 'device-link-pair';
const scene = { paired: false };
const sideOf = (frame: string) => (frame === 'phone' ? 'phone' : 'computer');
// La oferta de la computadora, como la deja pasar el servidor: la responde el celular.
const offer = [
  'v=0',
  'm=application 9 UDP/DTLS/SCTP webrtc-datachannel',
  'c=IN IP4 0.0.0.0',
  'a=fingerprint:sha-256 AA:BB:CC',
  'a=candidate:1 1 udp 2122260223 captura.local 5000 typ host',
  '',
].join('\r\n');

// Lo que pasa por el canal común, como lo manda el servidor de verdad.
const push = (base: string, topic: string, data: unknown) =>
  fetch(`${base}/__push?topic=${topic}&data=${encodeURIComponent(JSON.stringify(data))}`);

// Ana con la sesión abierta en los dos, sin vínculo hasta que el celular lee el código.
async function prepare(browser: Browser, base: string) {
  const closed = await recording(browser, base);
  const { context } = closed;
  await context.addInitScript(
    (saved) => {
      if (window.name === 'phone')
        Object.defineProperty(navigator, 'userAgentData', { get: () => ({ mobile: true }) });
      localStorage.setItem('session', JSON.stringify(saved));
    },
    { sessionId: 's', person: ana },
  );
  await context.addInitScript(fakeWebRtc);
  await context.addInitScript(fakeCamera, `${base}/pair#captura-vincular`);
  await answerUsers(context, ana);
  const reply = (body: unknown) => ({ json: body, headers: header() });
  await context.route('**/api/start', (route) =>
    route.fulfill(reply({ ...start(ana), parts: { pairing: null } })),
  );
  await context.route('**/api/device-link/check*', (route) => {
    const side = sideOf(route.request().frame().name());
    route.fulfill(reply(scene.paired ? { pairing: pairing(side), peer: 'ok' } : {}));
  });
  for (const path of ['signal', 'report', 'relay', 'pause', 'resume', 'unpair'])
    await context.route(`**/api/device-link/${path}`, (route) =>
      route.fulfill(reply({ ok: true })),
    );
  // El celular lee el código: quedan vinculados y la computadora se entera por su tema.
  await context.route('**/api/device-link/codes/read', async (route) => {
    scene.paired = true;
    await push(base, 'device-link.code', { paired: pairing('computer') });
    await route.fulfill(reply({ pairing: pairing('phone') }));
  });
  return closed;
}

async function play(page: Page, base: string): Promise<void> {
  const computer = frameOf(page, 'computer');
  const phone = frameOf(page, 'phone');
  const indicator = computer.locator('.link-indicator');
  const pill = phone.locator('.link-pill').filter({ visible: true }).first();
  await expect(indicator).toContainText('Sin vincular');
  await expect(pill).toBeVisible();
  await page.waitForTimeout(1200);
  // La computadora muestra el código.
  await indicator.click();
  await page.waitForTimeout(700);
  await computer.getByRole('button', { name: /Vincular el celular/ }).click();
  await expect(computer.locator('.link-code svg path').first()).toBeVisible();
  await page.waitForTimeout(1500);
  // El celular lo lee con la cámara.
  await pill.click();
  await page.waitForTimeout(700);
  await phone.getByRole('button', { name: /Leer el código/ }).click();
  await expect(indicator).toContainText('Esperando', { timeout: 10_000 });
  await expect(pill).toContainText('Esperando');
  await page.waitForTimeout(1200);
  // Se encuentran por el servidor y se conectan directo, por el Wi-Fi.
  const attempt = '0a1b2c3d';
  await push(base, 'device-link.pairing', { present: true, attempt });
  await push(base, 'device-link.pairing', { signal: { attempt, kind: 'offer', sdp: offer } });
  await expect(indicator).toContainText('Directo');
  await expect(pill).toContainText('Directo');
  await page.waitForTimeout(1500);
  // Lo que se toca en el celular se ve en la computadora.
  await phone
    .getByRole('navigation', { name: 'Las pestañas de Usuarios' })
    .getByRole('button', { name: 'Roles' })
    .click();
  await expect.poll(() => computer.url()).toMatch(/\/users\/roles$/);
  await page.waitForTimeout(2500);
}

clip({ name, prepare, play });
