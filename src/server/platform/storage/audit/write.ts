// Quién hizo qué (ADR-004, diseño de 05, §§ 2 y 3): SQLite, un archivo por año, escrito por tandas
// después de que PostgreSQL confirma. La aplicación solo agrega acciones: no hay forma de cambiarlas
// ni de borrarlas. Al escribir pone el color, el nombre de ese momento de quien la hizo y las
// personas de hoy, que la consulta usa para «(hoy: …)» y los filtros.
import type { DatabaseSync, StatementSync } from 'node:sqlite';
import { decode, type EventRow, encode, shortName } from './codec.ts';
import type { AuditEvent, PersonUpdate, StoredEvent, Target, ToneOf } from './event.ts';
import { openPeopleForWriting, openYearForWriting } from './schema.ts';

export type { AuditEvent, StoredEvent } from './event.ts';
export { inMemoryAudit } from './schema.ts';

export type AuditLog = {
  record(event: AuditEvent): void;
  // Cómo se calcula el color: lo da el módulo que conoce los tipos (diseño de 05, § 4).
  provideTone(toneOf: ToneOf): void;
  // Las personas que ya existían: se suman las que no tiene, sin pisar las que sí (diseño de 05, § 3).
  knowPeople(people: PersonUpdate[]): void;
  // Escribe lo que está esperando: antes de leer, para que se vea lo recién hecho.
  flush(): void;
  // Avisa después de escribir una tanda con algo (diseño de 05, § 7.1); devuelve cómo dejar de avisar.
  onWritten(listener: () => void): () => void;
  // Todo lo de un año, en orden; solo lo usan las pruebas.
  read(year: number): StoredEvent[];
  // Los archivos abiertos, para leerlos en el mismo hilo cuando están en memoria.
  openFiles(): { years: Map<number, DatabaseSync>; people: DatabaseSync };
  close(): void;
};

const batchSize = 100;
const flushEveryMs = 1_000;

// Los archivos abiertos para escribir: el de las personas, ya leído, y los de cada año, a medida que
// hacen falta.
function writingFiles(path: string) {
  const years = new Map<number, DatabaseSync>();
  const people = openPeopleForWriting(path);
  const known = loadPeople(people);
  const upsertPerson = people.prepare(
    `insert into people (user_id, name, email, state) values (?, ?, ?, ?)
     on conflict (user_id) do update set name = excluded.name, email = excluded.email, state = excluded.state`,
  );
  const yearFile = (year: number): DatabaseSync => {
    const existing = years.get(year);
    if (existing) return existing;
    const file = openYearForWriting(path, year);
    years.set(year, file);
    return file;
  };
  return { years, people, known, upsertPerson, yearFile };
}
type Files = ReturnType<typeof writingFiles>;

// Una tanda de un año, en una transacción por archivo: una sola escritura a disco, no una por línea.
function writeAll(files: Files, year: number, events: AuditEvent[], toneOf: ToneOf) {
  const file = files.yearFile(year);
  const insert = file.prepare(
    'insert into events (at, type, tone, actor_kind, user_id, payload) values (?, ?, ?, ?, ?, ?)',
  );
  const target = file.prepare('insert into targets (event_id, kind, target_id) values (?, ?, ?)');
  file.exec('begin');
  files.people.exec('begin');
  for (const event of events) {
    const named = withNames(event, files.known);
    const row = encode(named, toneOf(named));
    const { lastInsertRowid } = insert.run(
      row.at,
      row.type,
      row.tone,
      row.actorKind,
      row.userId,
      row.payload,
    );
    for (const one of named.targets ?? []) target.run(lastInsertRowid, one.kind, one.id);
    rememberPeople(files.upsertPerson, files.known, named);
  }
  files.people.exec('commit');
  file.exec('commit');
}

// Las que ya existían: se suman las que no tiene, sin pisar las que sí.
function knowPeople({ people, known }: Files, list: PersonUpdate[]) {
  const insert = people.prepare(
    'insert or ignore into people (user_id, name, email, state) values (?, ?, ?, ?)',
  );
  for (const one of list.filter((person) => !known.has(person.userId))) {
    insert.run(one.userId, shortName(one.name), one.email ?? null, one.state);
    known.set(one.userId, one);
  }
}

export function openAuditLog(path: string): AuditLog {
  const files = writingFiles(path);
  const pending: AuditEvent[] = [];
  let toneOf: ToneOf = () => 'plain';
  const listeners = new Set<() => void>();
  const flush = (): void => {
    if (pending.length === 0) return;
    const byYear = Map.groupBy(pending.splice(0), (event) => event.at.getUTCFullYear());
    for (const [year, events] of byYear) writeAll(files, year, events, toneOf);
    // Fuera de la pila de quien hizo escribir (un pedido de otro módulo), y cada uno aislado: un
    // error del aviso no corta la escritura ni el pedido.
    queueMicrotask(() => {
      for (const listener of listeners)
        try {
          listener();
        } catch {
          // El aviso es de más: si falla, lo escrito igual quedó.
        }
    });
  };
  const timer = setInterval(flush, flushEveryMs);
  timer.unref();
  return {
    record(event) {
      pending.push(event);
      if (pending.length >= batchSize) flush();
    },
    provideTone(given) {
      toneOf = given;
    },
    knowPeople: (list) => knowPeople(files, list),
    flush,
    onWritten(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    read(year) {
      flush();
      const file = files.years.get(year);
      if (!file) return [];
      const rows = file.prepare('select * from events order by id').all() as EventRow[];
      return rows.map((row) => decode(row, year));
    },
    openFiles: () => ({ years: files.years, people: files.people }),
    close() {
      clearInterval(timer);
      flush();
      for (const file of files.years.values()) file.close();
      files.people.close();
    },
  };
}

type Known = Map<string, PersonUpdate>;

function loadPeople(people: DatabaseSync): Known {
  const rows = people.prepare('select * from people').all() as {
    user_id: string;
    name: string;
    email: string | null;
    state: PersonUpdate['state'];
  }[];
  return new Map(
    rows.map((row) => [
      row.user_id,
      {
        userId: row.user_id,
        name: row.name,
        state: row.state,
        ...(row.email && { email: row.email }),
      },
    ]),
  );
}

// El nombre de ese momento de quien la hizo y de las personas que tocó, si el módulo no lo dio: el
// de hoy, que en este punto de la tanda es el de ese momento.
function withNames(event: AuditEvent, known: Known): AuditEvent {
  const { actor } = event;
  const nameOf = (userId: string) => known.get(userId)?.name;
  const named = (target: Target): Target => {
    const name = target.kind === 'person' && target.name === undefined && nameOf(target.id);
    return name ? { ...target, name } : target;
  };
  const actorName = actor.kind === 'person' ? (actor.name ?? nameOf(actor.userId)) : undefined;
  return {
    ...event,
    ...(actor.kind === 'person' && { actor: { ...actor, ...(actorName && { name: actorName }) } }),
    ...(event.targets && { targets: event.targets.map(named) }),
  };
}

// Las personas de hoy: las que la acción cambia y las que aparecen con nombre y todavía no estaban
// (así el primer Administrador, cargado por un comando aparte, aparece con su primera acción).
function rememberPeople(upsert: StatementSync, known: Known, event: AuditEvent) {
  const seen: PersonUpdate[] = [
    ...(event.actor.kind === 'person' && event.actor.name
      ? [{ userId: event.actor.userId, name: event.actor.name, state: 'active' as const }]
      : []),
    ...(event.targets ?? [])
      .filter((target) => target.kind === 'person' && target.name !== undefined)
      .map((target) => ({
        userId: target.id,
        name: target.name as string,
        state: 'active' as const,
      })),
  ].filter((person) => !known.has(person.userId));
  for (const person of [...seen, ...(event.people ?? [])]) {
    // Al borrar a alguien, su correo desaparece con él (02 · R3.7).
    const { email: given, ...rest } = person;
    const email = person.state === 'deleted' ? undefined : given;
    const saved: PersonUpdate = { ...rest, name: shortName(rest.name), ...(email && { email }) };
    upsert.run(saved.userId, saved.name, email ?? null, saved.state);
    known.set(saved.userId, saved);
  }
}
