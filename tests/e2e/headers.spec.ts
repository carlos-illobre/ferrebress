// 4 · Las cabeceras de Caddy, sin navegador (diseño de 01, «Cabeceras de Caddy»): la política
// estricta en la aplicación, sin Google; la excepción de estilos solo en el marco del botón de
// Google, que solo lo de /assets se guarde, que /api lleve solo lo que sirve para un JSON, y lo del
// manual.
import { expect, test } from '@playwright/test';

test('la aplicación es estricta y solo el marco de Google admite estilos en línea', async ({
  request,
}) => {
  const origin = String(process.env.E2E_ORIGIN);
  const app = (await request.get(`${origin}/`)).headers();
  const button = (await request.get(`${origin}/google-button.html`)).headers();
  expect(app['content-security-policy']).not.toContain('unsafe-inline');
  expect(app['content-security-policy']).not.toContain('google');
  expect(app['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(app['x-frame-options']).toBe('DENY');
  expect(button['content-security-policy']).toContain("style-src 'self' 'unsafe-inline'");
  expect(button['content-security-policy']).toContain("frame-ancestors 'self'");
  expect(button['x-frame-options']).toBe('SAMEORIGIN');
  for (const headers of [app, button]) {
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['strict-transport-security']).toContain('max-age=31536000');
    expect(headers.server).toBeUndefined();
    expect(headers['cache-control']).toBe('no-cache');
  }
  const link = (await request.get(`${origin}/link`)).headers();
  expect(link['cache-control']).toBe('no-cache');
  // /api: lo de seguridad que sirve para un JSON, sin lo de una página (cada byte se paga con datos).
  const api = (await request.get(`${origin}/api/health`)).headers();
  expect(api['content-security-policy']).toBe("default-src 'none'; frame-ancestors 'none'");
  expect(api['x-content-type-options']).toBe('nosniff');
  expect(api['strict-transport-security']).toContain('max-age=31536000');
  for (const pageOnly of ['permissions-policy', 'referrer-policy', 'x-frame-options'])
    expect(api[pageOnly]).toBeUndefined();
});

// El manual (diseño del manual, §§ 4 y 8): lo de /manual/ no se guarda (R6.8), lo que no está da
// 404 y no la página, la política es la misma de la aplicación, y las posiciones del aro y del
// rótulo, que se ponen por código, no violan la política estricta de estilos.
test('el manual no se guarda, lo que falta da 404 y abrir una tarea no viola la política', async ({
  request,
  page,
}) => {
  const origin = String(process.env.E2E_ORIGIN);
  const index = await request.get(`${origin}/manual/index.json`);
  expect(index.headers()['cache-control']).toBe('no-store');
  expect(index.headers()['content-security-policy']).not.toContain('unsafe-inline');
  expect((await request.get(`${origin}/manual/nada.json`)).status()).toBe(404);
  const violations: string[] = [];
  await page.exposeFunction('violated', (what: string) => violations.push(what));
  await page.addInitScript(() =>
    document.addEventListener('securitypolicyviolation', (event) =>
      (window as unknown as { violated: (what: string) => void }).violated(event.violatedDirective),
    ),
  );
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto(`${origin}/manual?d=computer&c=sign-in&t=phone&p=1`);
  await expect(page.locator('.manual-ring-label')).toBeVisible();
  await page.getByRole('button', { name: /^Siguiente/ }).click();
  await expect(page.locator('img[alt^="Captura"]')).toBeVisible();
  expect(violations).toEqual([]);
});
