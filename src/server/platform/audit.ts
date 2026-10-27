import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { deflateRawSync, inflateRawSync } from 'node:zlib';

// Quién hizo qué (ADR-004): SQLite, un archivo por año, lo de cada evento comprimido y escrito
// por tandas. La aplicación solo agrega eventos: no hay forma de cambiarlos ni borrarlos.
export type AuditEvent = {
  type: string;
  at: Date;
  userId?: string;
  email?: string;
  deviceId?: string;
  ipAddress?: string;
  data?: Record<string, unknown>;
};

export type AuditLog = {
  record(event: AuditEvent): void;
  read(year: number): AuditEvent[];
  close(): void;
};

export const inMemoryAudit = ':memory:';
const batchSize = 100;
const flushEveryMs = 1_000;

const createTable = `create table if not exists events (
  id integer primary key, at integer not null, type text not null, user_id text,
  device_id text, ip_address text, payload blob not null)`;

export function openAuditLog(path: string): AuditLog {
  const files = yearFiles(path);
  const pending: AuditEvent[] = [];
  const flush = (): void => {
    for (const event of pending.splice(0)) write(files.open(event.at.getUTCFullYear()), event);
  };
  const timer = setInterval(flush, flushEveryMs);
  timer.unref();

  return {
    record(event) {
      pending.push(event);
      if (pending.length >= batchSize) flush();
    },
    read(year) {
      flush();
      return files.exists(year) ? readEvents(files.open(year)) : [];
    },
    close() {
      clearInterval(timer);
      flush();
      files.close();
    },
  };
}

// Un archivo por año, abierto la primera vez que se lo necesita.
function yearFiles(path: string) {
  const open = new Map<number, DatabaseSync>();
  const inMemory = path === inMemoryAudit;
  return {
    exists: (year: number) => open.has(year) || (!inMemory && existsSync(fileName(path, year))),
    open(year: number): DatabaseSync {
      const existing = open.get(year);
      if (existing) return existing;
      if (!inMemory) mkdirSync(path, { recursive: true });
      const file = new DatabaseSync(inMemory ? path : fileName(path, year));
      file.exec(createTable);
      file.exec('create index if not exists events_at on events (at)');
      open.set(year, file);
      return file;
    },
    close: () => {
      for (const file of open.values()) file.close();
    },
  };
}

const fileName = (path: string, year: number): string => join(path, `${year}.sqlite`);

function write(file: DatabaseSync, { type, at, userId, deviceId, ipAddress, ...rest }: AuditEvent) {
  file
    .prepare(
      'insert into events (at, type, user_id, device_id, ip_address, payload) values (?, ?, ?, ?, ?, ?)',
    )
    .run(at.getTime(), type, userId ?? null, deviceId ?? null, ipAddress ?? null, compress(rest));
}

function readEvents(file: DatabaseSync): AuditEvent[] {
  const rows = file.prepare('select * from events order by id').all() as Row[];
  return rows.map((row) => ({
    type: row.type,
    at: new Date(row.at),
    ...(row.user_id && { userId: row.user_id }),
    ...(row.device_id && { deviceId: row.device_id }),
    ...(row.ip_address && { ipAddress: row.ip_address }),
    ...decompress(row.payload),
  }));
}

type Row = {
  at: number;
  type: string;
  user_id: string | null;
  device_id: string | null;
  ip_address: string | null;
  payload: Uint8Array;
};

const compress = (value: object): Buffer => deflateRawSync(JSON.stringify(value));
const decompress = (payload: Uint8Array): object =>
  JSON.parse(inflateRawSync(payload).toString('utf8'));
