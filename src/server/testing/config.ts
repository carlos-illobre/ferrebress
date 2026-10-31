// Una configuración completa para las pruebas del servidor: base y auditoría en memoria.
import {
  appVersionHeaderName,
  contractVersion,
  deviceIdHeaderName,
} from '@ferrebress/shared/contracts/contract-version';
import type { Config } from '../platform/config.ts';

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
  TRUSTED_PROXY: '172.20.0.2',
};

// Las cabeceras que la aplicación manda en todo pedido: su dispositivo y su versión del contrato.
export const appHeaders = (deviceId = '0192d3a4-1b2c-7d3e-8f40-123456789abc') => ({
  [deviceIdHeaderName]: deviceId,
  [appVersionHeaderName]: String(contractVersion),
});
