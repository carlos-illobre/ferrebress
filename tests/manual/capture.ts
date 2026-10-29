// Saca las capturas del manual de la aplicación (diseño del manual, § 3): cada escena de scenes.ts,
// con sus puntos medidos y la huella de la captura sin comprimir, en docs/manual/media/. Con
// MANUAL_CHECK=1 no guarda nada: compara cada huella con la guardada y falla con las que quedaron
// viejas («corré pnpm manual:media»).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import { closedContext, devices, mediaDir, phoneData, sha256, toWebp } from './media.ts';
import { now, type Scene, scenes } from './scenes.ts';

const checking = process.env.MANUAL_CHECK === '1';

// El centro de cada punto, en porcentaje de la pantalla.
async function measure(page: Page, scene: Scene): Promise<Record<string, [number, number]>> {
  const viewport = page.viewportSize() as { width: number; height: number };
  const points: Record<string, [number, number]> = {};
  for (const [name, locate] of Object.entries(scene.points)) {
    const box = await locate(page).boundingBox();
    if (!box) throw new Error(`${scene.name}: el punto «${name}» no se ve`);
    const percent = (at: number, size: number) => Math.round((at / size) * 1000) / 10;
    points[name] = [
      percent(box.x + box.width / 2, viewport.width),
      percent(box.y + box.height / 2, viewport.height),
    ];
  }
  return points;
}

// Lo que no puede salir nunca: el ambiente de pruebas ni lo que todavía no existe.
async function expectClean(page: Page): Promise<void> {
  await expect(page.locator('.test-frame')).toHaveCount(0);
  await expect(page.getByText('Pronto', { exact: true })).toHaveCount(0);
}

for (const scene of scenes) {
  test(scene.name, async ({ browser, baseURL }, testInfo) => {
    const device = devices[scene.device];
    const { context, escaped } = await closedContext(browser, baseURL as string, device.options);
    if (scene.device === 'phone') await context.addInitScript(phoneData);
    const page = await context.newPage();
    await page.clock.setFixedTime(now);
    await scene.prepare(page, context);
    await expectClean(page);
    const png = await page.screenshot({ animations: 'disabled', caret: 'hide' });
    const points = await measure(page, scene);
    expect(escaped, 'pedidos fuera del servidor de mentira').toEqual([]);
    const hash = sha256(png);
    const saved = join(mediaDir, `${scene.name}.json`);
    if (checking) {
      const stored = existsSync(saved) ? JSON.parse(readFileSync(saved, 'utf8')).hash : undefined;
      // La de ahora queda en los resultados, para ver qué cambió.
      if (stored !== hash) writeFileSync(testInfo.outputPath(`${scene.name}.png`), png);
      expect(stored, `${scene.name} quedó vieja: corré pnpm manual:media`).toBe(hash);
    } else {
      const webp = await toWebp(await context.newPage(), png, device.width);
      const height = Math.round((png.readUInt32BE(20) * device.width) / png.readUInt32BE(16));
      writeFileSync(join(mediaDir, `${scene.name}.webp`), webp);
      const description = { device: scene.device, width: device.width, height, points, hash };
      writeFileSync(saved, `${JSON.stringify(description, null, 2)}\n`);
    }
    await context.close();
  });
}
