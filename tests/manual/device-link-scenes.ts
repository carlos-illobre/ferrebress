// Las escenas del vínculo entre el celular y la computadora para su capítulo del manual (03): sin
// vincular, el código, conectados, desconectados y desvincular, en la computadora y en el celular.
// La conexión directa y la cámara son de mentira, dentro de la página de la captura: el directo abre
// solo con 8 ms de latencia y la cámara muestra un fondo liso, así cada captura sale igual. Lo que
// dice el tema del vínculo lo elige la cookie `link-scene` (tests/screens/serve.ts).

import { expect, type Page } from '@playwright/test';
import type { PairingView } from '../../src/shared/contracts/pairing.ts';
import { fakeCamera, fakeWebRtc } from './device-link-fakes.ts';
import { ana, answerUsers, header, hour, now, type Scene, start } from './scenes.ts';
import { button, shown } from './users-scenes.ts';

const day = 24 * hour;
const pairing = (side: PairingView['side'], paused = false): PairingView => ({
  id: '0190a000-0000-7000-8000-0000000d1e01',
  side,
  other: { label: side === 'computer' ? 'Chrome en Android' : 'Chrome en Windows' },
  since: now.getTime() - 9 * day,
  lastMirrored: now.getTime(),
  expiresAt: now.getTime() + 30 * day,
  lastsDays: 30,
  paused,
});

// La tira del día de Ana: dos horas y media directo, diez minutos por el servidor y de nuevo directo.
// La clave lleva el resumen corto de su identificador (FNV-1a, como strip.ts).
function shortHash(text: string): string {
  let hash = 0x811c9dc5;
  for (const char of text) hash = Math.imul(hash ^ (char.codePointAt(0) as number), 0x01000193);
  return (hash >>> 0).toString(16).padStart(8, '0');
}
const strip = {
  key: `device-link.strip.${shortHash(ana.userId)}`,
  saved: {
    day: '2026-10-28',
    marks: [
      { lane: 'direct', at: now.getTime() - 2.5 * hour },
      { lane: 'relayed', at: now.getTime() - 0.5 * hour },
      { lane: 'direct', at: now.getTime() - 0.33 * hour },
    ],
  },
};

type Setup = { linked: PairingView | null; topic?: 'alone' | 'present' | 'offer' };

// Ana con la sesión guardada, el vínculo que dice /api/start y lo que contesta el servidor del vínculo.
async function withLink(page: Page, { linked, topic = 'alone' }: Setup): Promise<void> {
  await page.addInitScript(fakeWebRtc);
  await page.addInitScript(fakeCamera);
  await page.addInitScript(
    ({ cookie, session, kept }) => {
      document.cookie = `link-scene=${cookie}; path=/`;
      localStorage.setItem('session', JSON.stringify(session));
      localStorage.setItem(kept.key, JSON.stringify(kept.saved));
    },
    { cookie: topic, session: { sessionId: 's', person: ana }, kept: strip },
  );
  await answerUsers(page, ana);
  const reply = (body: unknown) => ({ json: body, headers: header() });
  await page.route('**/api/start', (route) =>
    route.fulfill(reply({ ...start(ana), parts: { pairing: linked } })),
  );
  await page.route('**/api/device-link/check*', (route) =>
    route.fulfill(reply(linked ? { pairing: linked, peer: 'ok' } : {})),
  );
  for (const path of ['signal', 'report', 'relay', 'pause', 'resume', 'unpair'])
    await page.route(`**/api/device-link/${path}`, (route) => route.fulfill(reply({ ok: true })));
  await page.route('**/api/device-link/codes/read', (route) =>
    route.fulfill(reply({ pairing: pairing('phone') })),
  );
  await page.goto('/');
  await page.locator('.users-row').first().waitFor({ state: 'attached' });
}

const quiet = async (page: Page) => {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.getAnimations().length === 0);
};

const indicator = (page: Page) => page.locator('.link-indicator');
const pill = (page: Page) => shown(page.locator('.link-pill'));

// La computadora: el detalle abierto desde el indicador del pie del menú.
async function computerDetail(page: Page, setup: Setup, state: RegExp): Promise<void> {
  await withLink(page, setup);
  await expect(indicator(page)).toContainText(state);
  await indicator(page).click();
  await expect(page.locator('#link-detail')).toBeVisible();
  await quiet(page);
}

// El celular: la hoja abierta desde la pastilla de debajo del título.
async function phoneSheet(page: Page, setup: Setup, state: RegExp): Promise<void> {
  await withLink(page, setup);
  await expect(pill(page)).toContainText(state);
  await pill(page).click();
  await expect(page.locator('.link-sheet').first()).toBeVisible();
  await quiet(page);
}

export const deviceLinkScenes: Scene[] = [
  {
    name: 'desktop-link-unpaired',
    device: 'computer',
    prepare: (page) => computerDetail(page, { linked: null }, /Sin vincular/),
    points: {
      indicator,
      pair: button(/Vincular el celular/),
    },
  },
  {
    name: 'desktop-link-code',
    device: 'computer',
    prepare: async (page) => {
      await computerDetail(page, { linked: null }, /Sin vincular/);
      await button(/Vincular el celular/)(page).click();
      await expect(page.locator('.link-code svg path').first()).toBeVisible();
      await quiet(page);
    },
    points: {
      code: (page) => page.locator('.link-code svg').first(),
      renews: (page) => page.locator('.qr-renews'),
    },
  },
  {
    name: 'desktop-link-direct',
    device: 'computer',
    prepare: async (page) => {
      await computerDetail(page, { linked: pairing('computer'), topic: 'present' }, /Directo/);
      await expect(page.locator('.route-latency')).toContainText('8 ms');
    },
    points: {
      indicator,
      route: (page) => page.locator('.route-box'),
      today: (page) => page.locator('.today-strip'),
      facts: (page) => page.locator('.facts'),
      pause: button(/Desconectar/),
      unpair: button(/Desvincular/),
    },
  },
  {
    name: 'desktop-link-paused',
    device: 'computer',
    prepare: (page) => computerDetail(page, { linked: pairing('computer', true) }, /Desconectado/),
    points: { resume: button(/Reconectar/) },
  },
  {
    name: 'desktop-link-unpair',
    device: 'computer',
    prepare: async (page) => {
      await computerDetail(page, { linked: pairing('computer'), topic: 'present' }, /Directo/);
      await button(/Desvincular/)(page).click();
      await expect(page.getByRole('alertdialog')).toBeVisible();
      await quiet(page);
    },
    points: { confirm: (page) => page.getByRole('alertdialog').locator('[data-primary]') },
  },
  {
    name: 'phone-link-unpaired',
    device: 'phone',
    prepare: async (page) => {
      await withLink(page, { linked: null });
      await expect(pill(page)).toBeVisible();
      await quiet(page);
    },
    points: { pill },
  },
  {
    name: 'phone-link-sheet',
    device: 'phone',
    prepare: (page) => phoneSheet(page, { linked: null }, /Sin vincular/),
    points: { read: button(/Leer el código/) },
  },
  {
    name: 'phone-link-camera',
    device: 'phone',
    prepare: async (page) => {
      await phoneSheet(page, { linked: null }, /Sin vincular/);
      await button(/Leer el código/)(page).click();
      await expect(page.locator('.camera')).toBeVisible();
      await quiet(page);
    },
    points: { frame: (page) => page.locator('.camera-frame') },
  },
  {
    name: 'phone-link-direct',
    device: 'phone',
    prepare: (page) => phoneSheet(page, { linked: pairing('phone'), topic: 'offer' }, /Directo/),
    points: {
      route: (page) => shown(page.locator('.route-box')),
      today: (page) => shown(page.locator('.today-strip')),
      pause: button(/Desconectar/),
      unpair: button(/Desvincular/),
    },
  },
];
