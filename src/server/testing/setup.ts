// Antes de cada archivo de pruebas del servidor: las bases en memoria arrancan desde la que dejó
// testing/pglite-template.ts. La zona del negocio es la de la ferretería, como en el .env de pruebas.
import { readFileSync } from 'node:fs';
import { setBusinessTimeZone } from '@ferrebress/shared/time/business';
import { inject } from 'vitest';
import { useMemoryTemplate } from '../platform/storage/db.ts';

useMemoryTemplate(new Blob([readFileSync(inject('pgliteTemplate'))]));
setBusinessTimeZone('America/Argentina/Buenos_Aires');
