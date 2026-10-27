// 4 · Las cabeceras de Caddy, sin navegador (diseño de 01, «Cabeceras de Caddy»): la política
// estricta en la aplicación y la excepción de estilos solo en el marco del botón de Google.
import { expect, test } from '@playwright/test';

test('la aplicación es estricta y solo el marco de Google admite estilos en línea', async ({
  request,
}) => {
  const origin = String(process.env.E2E_ORIGIN);
  const app = (await request.get(`${origin}/`)).headers();
  const button = (await request.get(`${origin}/google-button.html`)).headers();
  expect(app['content-security-policy']).not.toContain('unsafe-inline');
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
  }
});
