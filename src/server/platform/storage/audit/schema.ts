// Los archivos de la auditoría y sus tablas (ADR-004, diseño de 05, § 3): uno por año, con la forma
// v1, y uno con las personas de hoy. Los de la forma vieja (`<año>.sqlite`) solo existieron en el
// ambiente de pruebas y se borran (decisión de Carlos): así hay una sola forma de leer.
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export const inMemoryAudit = ':memory:';

const yearFile = /^(\d{4})\.v1\.sqlite$/;
const legacyFile = /^\d{4}\.sqlite(-wal|-shm)?$/;

export const yearFileName = (path: string, year: number): string => join(path, `${year}.v1.sqlite`);
export const peopleFileName = (path: string): string => join(path, 'people.v1.sqlite');

// El color, como entero chico en su columna con índice.
export const toneCodes = { plain: 0, amber: 1, red: 2 } as const;
export const actorCodes = { person: 0, system: 1, outsider: 2 } as const;

const eventsTables = `
  create table if not exists events (
    id integer primary key, at integer not null, type text not null, tone integer not null,
    actor_kind integer not null, user_id text, payload blob not null);
  create table if not exists targets (
    event_id integer not null, kind text not null, target_id text not null);
  create index if not exists events_at on events (at, id);
  create index if not exists events_user on events (user_id, at, id);
  create index if not exists events_actor on events (actor_kind, at, id);
  create index if not exists events_type on events (type, at, id);
  create index if not exists events_tone on events (tone, at, id);
  create index if not exists targets_target on targets (target_id, event_id);`;

const peopleTable = `create table if not exists people (
  user_id text primary key, name text not null, email text, state text not null)`;

// Abre (y crea, si hace falta) el archivo de un año para escribir.
export function openYearForWriting(path: string, year: number): DatabaseSync {
  const file = new DatabaseSync(path === inMemoryAudit ? path : yearFileName(path, year));
  if (path !== inMemoryAudit) file.exec('pragma journal_mode = wal');
  file.exec(eventsTables);
  file.exec('pragma optimize');
  return file;
}

export function openPeopleForWriting(path: string): DatabaseSync {
  if (path !== inMemoryAudit) {
    mkdirSync(path, { recursive: true });
    removeLegacyFiles(path);
  }
  const file = new DatabaseSync(path === inMemoryAudit ? path : peopleFileName(path));
  if (path !== inMemoryAudit) file.exec('pragma journal_mode = wal');
  file.exec(peopleTable);
  return file;
}

// Los años que tienen archivo, del más nuevo al más viejo. Leer nunca crea un archivo.
export function existingYears(path: string): number[] {
  if (!existsSync(path)) return [];
  return readdirSync(path)
    .map((name) => yearFile.exec(name)?.[1])
    .filter((year) => year !== undefined)
    .map(Number)
    .sort((a, b) => b - a);
}

function removeLegacyFiles(path: string): void {
  for (const name of readdirSync(path).filter((one) => legacyFile.test(one)))
    rmSync(join(path, name));
}
