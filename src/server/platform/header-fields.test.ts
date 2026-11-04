// Los campos que suman los módulos a la cabecera (diseño de 03, § 3.5).
import { describe, expect, it } from 'vitest';
import { appHeaders, testConfig } from '../testing/config.ts';
import { createHeaderFields } from './header-fields.ts';
import { createHttp } from './http.ts';
import { createRateLimiter } from './limits/rate-limit.ts';

function serverWith(fields: ReturnType<typeof createHeaderFields>) {
  const clock = { now: () => new Date(5) };
  const http = createHttp({
    ...{ environment: 'testing', version: 'v1', publicOrigin: testConfig.PUBLIC_ORIGIN },
    ...{ trustedProxy: testConfig.TRUSTED_PROXY, clock, audit: {} as never },
    ...{ limiter: createRateLimiter(clock), fields },
  });
  http.get('/api/x', (c) => c.json({}));
  return http;
}

describe('los campos de la cabecera', () => {
  it('cada módulo suma el suyo, y el que no tiene valor para este pedido no va', async () => {
    const fields = createHeaderFields();
    fields.contribute('l', (c) => (c.req.header('X-Con') ? '0a1b2c3d' : undefined));
    const http = serverWith(fields);
    const withField = await http.request('/api/x', { headers: { ...appHeaders(), 'X-Con': '1' } });
    expect(withField.headers.get('X-Ferrebress')).toBe('v=v1; t=5; e=testing; l=0a1b2c3d');
    const without = await http.request('/api/x', { headers: appHeaders() });
    expect(without.headers.get('X-Ferrebress')).toBe('v=v1; t=5; e=testing');
  });

  it('una letra de la cabecera, repetida o que no es una letra no se puede usar', () => {
    const fields = createHeaderFields();
    fields.contribute('l', () => undefined);
    for (const letter of ['v', 'p', 'l', 'ab', '1'])
      expect(() => fields.contribute(letter, () => undefined)).toThrow('no está libre');
  });

  it('un valor sin forma de campo es un error de programación', async () => {
    const fields = createHeaderFields();
    fields.contribute('m', () => 'con espacio');
    const response = await serverWith(fields).request('/api/x', { headers: appHeaders() });
    expect(response.status).toBe(500);
  });
});
