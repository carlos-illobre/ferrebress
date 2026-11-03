// De dónde lee la consulta (query.ts): los archivos del disco, abiertos de solo lectura y solo si
// existen (revisión de seguridad de 05, puntos 4 y 9), o los que la auditoría tiene en memoria.
import { existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import type { Source } from './query.ts';
import { existingYears, peopleFileName, yearFileName } from './schema.ts';
import type { AuditLog } from './write.ts';

export function fileSource(path: string): Source {
  const open = new Map<string, DatabaseSync>();
  const reading = (name: string) => {
    const known = open.get(name);
    if (known) return known;
    if (!existsSync(name)) return undefined;
    const file = new DatabaseSync(name, { readOnly: true });
    open.set(name, file);
    return file;
  };
  return {
    years: () => existingYears(path),
    file: (year) => reading(yearFileName(path, year)),
    people: () => reading(peopleFileName(path)),
  };
}

export function memorySource(audit: AuditLog): Source {
  const files = () => audit.openFiles();
  return {
    years: () => [...files().years.keys()].sort((a, b) => b - a),
    file: (year) => files().years.get(year),
    people: () => files().people,
  };
}
