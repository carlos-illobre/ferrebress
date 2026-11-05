// Lo común de los clips del manual (diseño del manual, § 3): una sola página con la computadora y el
// celular uno al lado del otro, cada uno con la aplicación en su marco, así sale un solo video sin
// dos que se desfasen. Cada clip da su contexto (las respuestas de su guion) y su guion; esto graba,
// guarda el video mudo y su último cuadro.
import { copyFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  type Browser,
  type BrowserContext,
  expect,
  type Frame,
  type Page,
  test,
} from '@playwright/test';
import { closedContext, expectClean, mediaDir, toWebp } from './media.ts';
import { now } from './scenes.ts';

export const size = { width: 1280, height: 720 };

const stage = (base: string) => `<!doctype html>
<html><body style="margin:0;width:1280px;height:720px;background:#12382f;overflow:hidden">
<iframe name="computer" src="${base}/" style="position:absolute;left:48px;top:140px;width:1366px;height:768px;border:0;border-radius:10px;transform:scale(.62);transform-origin:0 0"></iframe>
<iframe name="phone" src="${base}/" style="position:absolute;left:960px;top:80px;width:390px;height:844px;border:0;border-radius:28px;outline:6px solid #0b0d0c;transform:scale(.66);transform-origin:0 0"></iframe>
</body></html>`;

export const frameOf = (page: Page, wanted: string) =>
  page.frames().find((frame) => frame.name() === wanted) as Frame;

// Un contexto encerrado en el servidor de mentira, que graba.
export async function recording(browser: Browser, baseURL: string) {
  const videos = mkdtempSync(join(tmpdir(), 'ferrebress-clip-'));
  return closedContext(browser, baseURL, { viewport: size, recordVideo: { dir: videos, size } });
}

type Clip = {
  name: string;
  prepare: (
    browser: Browser,
    baseURL: string,
  ) => Promise<{ context: BrowserContext; escaped: string[] }>;
  play: (page: Page, baseURL: string) => Promise<void>;
};

// Graba el guion y guarda el video y su último cuadro. Con MANUAL_CHECK=1 no corre: un video no sale
// igual dos veces.
export function clip({ name, prepare, play }: Clip): void {
  test(name, async ({ browser, baseURL }) => {
    test.skip(process.env.MANUAL_CHECK === '1', 'un video no sale igual dos veces');
    const base = baseURL as string;
    const { context, escaped } = await prepare(browser, base);
    const page = await context.newPage();
    await page.clock.setFixedTime(now);
    // La escena se sirve desde el mismo servidor: los marcos con la aplicación necesitan una página
    // segura alrededor (crypto.randomUUID, la huella).
    await page.route('**/clip-stage', (route) =>
      route.fulfill({ contentType: 'text/html', body: stage(base) }),
    );
    await page.goto('/clip-stage');
    await play(page, base);
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
}
