// 03 · El celular y la computadora, con dos navegadores de verdad (lo aprobó Carlos): lo único que no
// prueba la simulación de dos dispositivos es WebRTC de verdad. Vincular leyendo el código, ir directo
// en los dos, la pantalla de la computadora en el celular, y desvincular. La prueba lee el código del
// canal en tiempo real, que es lo mismo que dibuja el QR.
//
// Chromium esconde las direcciones del Wi-Fi con nombres .local que una máquina de pruebas no
// resuelve: acá las muestra, como un celular con el permiso de la cámara. Si la máquina no tiene
// ninguna dirección privada (la de un contenedor, 192.0.2.x), el filtro las saca todas, como haría en
// el local, y lo que se prueba es el respaldo: «Por el servidor».

import { expect, type Page, test } from '@playwright/test';
import { keepsCandidate } from '../../src/shared/peer/candidates.ts';
import { computer, phone } from './support/devices.ts';
import { signInWithGoogle } from './support/google.ts';

test.use({ launchOptions: { args: ['--disable-features=WebRtcHideLocalIpsWithMdns'] } });

type WithCodes = { e2eCodes: string[] };

// Las direcciones que ofrece el navegador, y si alguna pasa el filtro del vínculo.
async function canGoDirect(page: Page): Promise<boolean> {
  const lines = await page.evaluate(async () => {
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('probe');
    const found: string[] = [];
    pc.onicecandidate = (event) => event.candidate && found.push(event.candidate.candidate);
    await pc.setLocalDescription(await pc.createOffer());
    await new Promise((settled) => setTimeout(settled, 1000));
    pc.close();
    return found;
  });
  return lines.some((line) => keepsCandidate(`a=${line}`));
}

// La computadora guarda los códigos que le manda el canal (lo que dibuja el QR).
async function watchCodes(desk: Page): Promise<void> {
  await desk.addInitScript(() => {
    const codes: string[] = [];
    (window as unknown as WithCodes).e2eCodes = codes;
    const original = window.fetch;
    window.fetch = async (...args) => {
      const response = await original(...args);
      if (!String(args[0]).includes('device-link.code') || !response.body) return response;
      const [mine, theirs] = response.body.tee();
      void (async () => {
        const reader = mine.pipeThrough(new TextDecoderStream()).getReader();
        for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read())
          for (const found of chunk.value.matchAll(/"code":"([^"]+)"/g))
            codes.push(found[1] as string);
      })();
      return new Response(theirs, response);
    };
  });
}

async function shownCode(desk: Page): Promise<string> {
  await desk.getByRole('button', { name: /Sin vincular/ }).click();
  await desk.getByRole('button', { name: /Vincular el celular/ }).click();
  await expect
    .poll(() => desk.evaluate(() => (window as unknown as WithCodes).e2eCodes.length))
    .toBeGreaterThan(0);
  return desk.evaluate(() => (window as unknown as WithCodes).e2eCodes.at(-1) as string);
}

test('vincular con el código, conectarse, espejar la pantalla y desvincular', async ({
  browser,
}) => {
  test.setTimeout(60_000);
  const desk = await computer(browser);
  await watchCodes(desk);
  await desk.goto('/');
  await signInWithGoogle(desk);
  const hand = await phone(browser);
  await hand.goto('/');
  await signInWithGoogle(hand);
  await hand.getByRole('button', { name: 'Ahora no' }).click();

  await hand.goto(`/pair#${await shownCode(desk)}`);
  const state = (await canGoDirect(desk)) ? /^Directo, con/ : /^Por el servidor, con/;
  await expect(desk.getByRole('button', { name: state })).toBeVisible({ timeout: 15_000 });
  await expect(hand.getByRole('button', { name: state })).toBeVisible({ timeout: 15_000 });

  // Lo que se toca en la computadora se ve en el celular: la pestaña Roles.
  await desk.keyboard.press('Escape');
  await desk
    .getByRole('navigation', { name: 'Las pestañas de Usuarios' })
    .getByRole('button', { name: 'Roles' })
    .click();
  await expect(hand).toHaveURL(/\/users\/roles$/);

  // Desvincular termina para los dos.
  await desk.getByRole('button', { name: state }).click();
  await desk.getByRole('button', { name: /Desvincular/ }).click();
  await desk
    .getByRole('alertdialog')
    .getByRole('button', { name: /Desvincular/ })
    .click();
  await expect(desk.getByRole('button', { name: /Sin vincular/ })).toBeVisible();
  await expect(hand.getByRole('button', { name: /Sin vincular/ })).toBeVisible({ timeout: 10_000 });
});
