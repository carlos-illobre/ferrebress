// Antes de cada archivo de pruebas del servidor: las bases en memoria arrancan desde la que dejó
// testing/pglite-template.ts.
import { readFileSync } from 'node:fs';
import { inject } from 'vitest';
import { useMemoryTemplate } from '../platform/db.ts';

useMemoryTemplate(new Blob([readFileSync(inject('pgliteTemplate'))]));
