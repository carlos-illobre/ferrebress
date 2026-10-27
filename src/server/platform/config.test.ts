import { describe, expect, it } from 'vitest';
import { ConfigError, readConfig } from './config.ts';

const valid = {
  ENVIRONMENT: 'testing',
  VERSION: 'abc123',
  PORT: '3000',
  PUBLIC_ORIGIN: 'https://ferrebress-pruebas.duckdns.org',
  DATABASE_URL: 'postgres://db/ferrebress',
  AUDIT_PATH: '/data/audit',
  GOOGLE_CLIENT_ID: 'cliente.apps.googleusercontent.com',
  GOOGLE_ISSUER: 'https://accounts.google.com',
  GOOGLE_JWKS_URL: 'https://www.googleapis.com/oauth2/v3/certs',
  GOOGLE_SCRIPT_URL: 'https://accounts.google.com/gsi/client',
  INITIAL_ADMIN_EMAIL: 'admin@example.com',
  TRUSTED_PROXY: '172.20.0.2',
};

describe('la configuración del .env', () => {
  it('se lee completa', () => {
    expect(readConfig(valid)).toMatchObject({ ENVIRONMENT: 'testing', PORT: 3000 });
  });

  it('si falta una variable, dice su nombre y nunca un valor', () => {
    const { DATABASE_URL: _, ...missing } = valid;
    const error = (() => {
      try {
        readConfig({ ...missing, PORT: 'x' });
      } catch (thrown) {
        return thrown as Error;
      }
    })();
    expect(error).toBeInstanceOf(ConfigError);
    expect(error?.message).toContain('DATABASE_URL');
    expect(error?.message).toContain('PORT');
    expect(error?.message).not.toContain('postgres://');
  });

  it.each(['testing', 'production'])('con %s no acepta un emisor de Google de prueba', (env) => {
    const fake = { ...valid, ENVIRONMENT: env, GOOGLE_ISSUER: 'https://emisor-de-prueba.local' };
    expect(() => readConfig(fake)).toThrow(/GOOGLE_ISSUER/);
    const script = { ...valid, ENVIRONMENT: env, GOOGLE_SCRIPT_URL: 'https://otro.local/gsi.js' };
    expect(() => readConfig(script)).toThrow(/GOOGLE_SCRIPT_URL/);
  });

  it('en las pruebas de punta a punta acepta el emisor de prueba', () => {
    const e2e = { ...valid, ENVIRONMENT: 'e2e', GOOGLE_ISSUER: 'http://localhost:9000' };
    expect(readConfig(e2e).GOOGLE_ISSUER).toBe('http://localhost:9000');
  });
});
