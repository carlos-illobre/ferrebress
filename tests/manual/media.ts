// Lo común de las capturas del manual (diseño del manual, § 3): el navegador encerrado en el servidor
// de mentira, el tamaño de cada dispositivo, el paso a WebP en el mismo Chromium (sin dependencias)
// y dónde se guarda cada cosa.
import { join } from 'node:path';
import {
  type Browser,
  type BrowserContext,
  type BrowserContextOptions,
  expect,
  type Frame,
  type Page,
} from '@playwright/test';
import type { Device } from '../../src/shared/contracts/manual.ts';
import { maxCaptureBytes } from '../../tools/manual/media.ts';

export const mediaDir = join(import.meta.dirname, '../../docs/manual/media');

const phoneUserAgent =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/141 Mobile';

// La computadora a su tamaño (se guarda a 1100 px de ancho); el celular, a una vez y media.
export const devices: Record<Device, { options: BrowserContextOptions; width: number }> = {
  computer: { options: { viewport: { width: 1366, height: 768 } }, width: 1100 },
  phone: {
    options: {
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1.5,
      userAgent: phoneUserAgent,
      isMobile: true,
      hasTouch: true,
    },
    width: 585,
  },
};

// Chromium dice que es un celular solo con el agente; la aplicación también mira userAgentData.
export const phoneData = () =>
  Object.defineProperty(navigator, 'userAgentData', { get: () => ({ mobile: true }) });

// La página del botón de Google precarga el script de Google: se corta igual, sin frenar la escena.
const cutQuietly = new Set(['https://accounts.google.com/gsi/client']);

// Un contexto que solo puede pedir al servidor de mentira: cualquier otro pedido se corta y queda
// anotado, y la escena falla (revisión de seguridad, 4). Sin service worker, que pediría por su
// cuenta sin pasar por el corte.
export async function closedContext(
  browser: Browser,
  baseURL: string,
  options: BrowserContextOptions,
): Promise<{ context: BrowserContext; escaped: string[] }> {
  const context = await browser.newContext({
    ...options,
    baseURL,
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const escaped: string[] = [];
  const origin = new URL(baseURL).origin;
  await context.route('**/*', (route) => {
    const url = route.request().url();
    if (new URL(url).origin === origin) return route.fallback();
    if (!cutQuietly.has(url)) escaped.push(url);
    return route.abort();
  });
  return { context, escaped };
}

// Lo que no puede salir nunca: el ambiente de pruebas.
export async function expectClean(page: Page | Frame): Promise<void> {
  await expect(page.locator('.test-frame')).toHaveCount(0);
}

// Pasa una imagen PNG a WebP del ancho pedido con el canvas de Chromium, bajando la calidad hasta que
// entre en el tope.
export async function toWebp(page: Page, png: Buffer, width: number): Promise<Buffer> {
  for (const quality of [0.86, 0.8, 0.72, 0.64]) {
    const encoded = await page.evaluate(
      async ({ data, width: wide, quality: q }) => {
        const image = new Image();
        image.src = data;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = wide;
        canvas.height = Math.round((image.height * wide) / image.width);
        const drawing = canvas.getContext('2d') as CanvasRenderingContext2D;
        drawing.imageSmoothingQuality = 'high';
        drawing.drawImage(image, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise<Blob>((done) =>
          canvas.toBlob((made) => done(made as Blob), 'image/webp', q),
        );
        const bytes = new Uint8Array(await blob.arrayBuffer());
        let text = '';
        for (const byte of bytes) text += String.fromCharCode(byte);
        return btoa(text);
      },
      { data: `data:image/png;base64,${png.toString('base64')}`, width, quality },
    );
    const webp = Buffer.from(encoded, 'base64');
    if (webp.length <= maxCaptureBytes) return webp;
  }
  throw new Error(`la captura no entra en ${maxCaptureBytes / 1024} KB`);
}
