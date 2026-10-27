import type { Config } from '../platform/config.ts';

// Una configuración completa para las pruebas: base y auditoría en memoria.
export const testConfig: Config = {
  ENVIRONMENT: 'testing',
  VERSION: 'test',
  PORT: 3000,
  PUBLIC_ORIGIN: 'https://ferrebress-pruebas.duckdns.org',
  DATABASE_URL: 'memory://',
  AUDIT_PATH: ':memory:',
  GOOGLE_CLIENT_ID: 'cliente.apps.googleusercontent.com',
  GOOGLE_ISSUER: 'https://accounts.google.com',
  GOOGLE_JWKS_URL: 'https://www.googleapis.com/oauth2/v3/certs',
  GOOGLE_SCRIPT_URL: 'https://accounts.google.com/gsi/client',
  GEO_DATABASE_PATH: '/data/geo/city.mmdb',
  INITIAL_ADMIN_EMAIL: 'admin@example.com',
  TRUSTED_PROXY: '172.20.0.2',
};
