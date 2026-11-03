// Las escenas de la pestaña Quién hizo qué para su capítulo del manual (05 · R4), en la computadora
// y en el celular: la lista, un filtro y la cinta, con los datos de audit-log-data.ts.

import { expect, type Page } from '@playwright/test';
import { answerAuditLog } from './audit-log-data.ts';
import { ana, type Scene, signedIn } from './scenes.ts';
import { button, shown } from './users-scenes.ts';

// La pestaña abierta, con todo cargado y quieto, así la captura sale igual cada vez.
async function auditLog(page: Page): Promise<void> {
  await signedIn(page, ana, answerAuditLog);
  await page.goto('/users/audit-log');
  await shown(page.locator('.audit-row')).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.getAnimations().length === 0);
}

const settled = (page: Page) => page.waitForFunction(() => document.getAnimations().length === 0);

// En la computadora, la lista filtrada por Lucía, con el filtro abierto antes de elegir.
async function filtering(page: Page): Promise<void> {
  await auditLog(page);
  await button(/Hecho por/)(page).click();
  await expect(page.getByRole('option', { name: /^Lucía Fernández/ })).toBeVisible();
  await settled(page);
}

// La cinta abierta desde la tira, en la acción de las 9:40.
async function tape(page: Page): Promise<void> {
  await auditLog(page);
  const strip = page.getByRole('button', { name: 'Ver el día como una grabación' });
  const rail = (await strip.locator('.audit-rail').boundingBox()) as {
    x: number;
    width: number;
    y: number;
  };
  const place = (9 * 3600 + 40 * 60 - 8 * 3600) / (12 * 3600 - 8 * 3600);
  await page.mouse.click(rail.x + rail.width * place, rail.y + 4);
  await expect(page.locator('.tape-subtitle')).toContainText('correo no autorizado');
  await page.mouse.move(0, 0);
  await settled(page);
}

// En el celular, la cinta desde «Ver el día».
async function phoneTape(page: Page): Promise<void> {
  await auditLog(page);
  await button(/Ver el día/)(page).click();
  await expect(page.locator('.tape-subtitle')).toBeVisible();
  await settled(page);
}

// En el celular, el detalle de una acción, en su hoja.
async function phoneDetail(page: Page): Promise<void> {
  await auditLog(page);
  await shown(page.locator('.audit-row')).click();
  await expect(page.locator('.audit-detail-body')).toBeVisible();
  await settled(page);
}

const row = (page: Page) => shown(page.locator('.audit-row'));

export const auditLogScenes: Scene[] = [
  {
    name: 'desktop-audit-log',
    device: 'computer',
    prepare: auditLog,
    points: {
      tab: button(/^Quién hizo qué/),
      numbers: (page) => shown(page.locator('.audit-number.audit-red')),
      row,
      detail: (page) => shown(page.locator('.audit-detail h2, .audit-detail-body')),
    },
  },
  {
    name: 'desktop-audit-log-filter',
    device: 'computer',
    prepare: filtering,
    points: {
      by: button(/Hecho por/),
      person: (page) => page.getByRole('option', { name: /^Lucía Fernández/ }),
    },
  },
  {
    name: 'desktop-audit-log-tape',
    device: 'computer',
    prepare: tape,
    points: {
      head: (page) => page.locator('.tape-head'),
      play: button(/Reproducir el día/),
      lane: button(/Ver solo a Ana Gómez/),
      close: button(/^Cerrar/),
    },
  },
  {
    name: 'phone-audit-log',
    device: 'phone',
    prepare: auditLog,
    points: { tab: button(/^Quién hizo qué/), row, day: button(/Ver el día/) },
  },
  {
    name: 'phone-audit-log-detail',
    device: 'phone',
    prepare: phoneDetail,
    points: { detail: (page) => shown(page.locator('.audit-detail-body')) },
  },
  {
    name: 'phone-audit-log-tape',
    device: 'phone',
    prepare: phoneTape,
    points: {
      next: button(/Acción siguiente/),
      play: button(/Reproducir el día/),
    },
  },
];
