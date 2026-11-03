// Quién lee la auditoría (diseño de 05, § 5): en un hilo aparte, así una consulta larga no frena al
// resto del servidor; con la auditoría en memoria (las pruebas), en el mismo hilo. Antes de cada
// pedido se escribe la tanda pendiente, así quien acaba de hacer algo lo ve.
import { Worker } from 'node:worker_threads';
import { type Answer, createQuery, type Request } from './query.ts';
import { inMemoryAudit } from './schema.ts';
import { memorySource } from './source.ts';
import type { AuditLog } from './write.ts';

export type AuditReader = {
  ask(request: Request): Promise<Answer>;
  close(): Promise<void>;
};

const currentYear = () => new Date().getUTCFullYear();

export function openAuditReader(path: string, audit: AuditLog): AuditReader {
  if (path === inMemoryAudit) {
    const query = createQuery(memorySource(audit), currentYear);
    return {
      ask: async (request) => {
        audit.flush();
        return query(request);
      },
      close: async () => undefined,
    };
  }
  return threadReader(path, audit);
}

type Reply = { id: number; answer?: Answer; error?: string };

function threadReader(path: string, audit: AuditLog): AuditReader {
  const worker = new Worker(new URL('./thread.ts', import.meta.url), { workerData: { path } });
  worker.unref();
  const waiting = new Map<
    number,
    { resolve: (answer: Answer) => void; reject: (e: Error) => void }
  >();
  let next = 0;
  worker.on('message', ({ id, answer, error }: Reply) => {
    const pending = waiting.get(id);
    waiting.delete(id);
    if (error === undefined) pending?.resolve(answer as Answer);
    else pending?.reject(new Error(error));
  });
  return {
    ask(request) {
      audit.flush();
      const id = next++;
      return new Promise((resolve, reject) => {
        waiting.set(id, { resolve, reject });
        worker.postMessage({ id, request });
      });
    },
    close: async () => {
      await worker.terminate();
    },
  };
}
