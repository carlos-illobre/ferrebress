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
  thread?: () => Worker;
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
type Waiting = Map<number, { resolve: (answer: Answer) => void; reject: (e: Error) => void }>;

// Lo que puede usar el hilo y cuánto puede tardar una respuesta: si se pasa, el pedido falla y el
// resto del servidor sigue (revisión de seguridad de 05, punto 12).
export const readerLimits = { memoryMb: 256, answerMs: 10_000 };

// Un hilo que, si se cae, se vuelve a crear: lo que esperaba falla, nada queda colgado y el proceso
// no termina con él.
function spawn(path: string, waiting: Waiting): Worker {
  const worker = new Worker(new URL('./thread.ts', import.meta.url), {
    workerData: { path },
    resourceLimits: { maxOldGenerationSizeMb: readerLimits.memoryMb },
  });
  worker.unref();
  worker.on('message', ({ id, answer, error }: Reply) => {
    const pending = waiting.get(id);
    waiting.delete(id);
    if (error === undefined) pending?.resolve(answer as Answer);
    else pending?.reject(new Error(error));
  });
  worker.on('error', () => undefined);
  return worker;
}

function threadReader(path: string, audit: AuditLog): AuditReader {
  const waiting: Waiting = new Map();
  let closing = false;
  let worker = spawn(path, waiting);
  const fail = (id: number, message: string) => {
    waiting.get(id)?.reject(new Error(message));
    waiting.delete(id);
  };
  const watch = (current: Worker) =>
    current.on('exit', () => {
      // Solo cuenta el hilo de ahora: uno que ya se reemplazó no rechaza lo del nuevo.
      if (current !== worker) return;
      for (const id of [...waiting.keys()]) fail(id, 'El hilo de la auditoría se cerró');
      if (closing) return;
      worker = spawn(path, waiting);
      watch(worker);
    });
  watch(worker);
  let next = 0;
  return {
    ask(request) {
      audit.flush();
      const id = next++;
      return new Promise((resolve, reject) => {
        waiting.set(id, { resolve, reject });
        setTimeout(() => fail(id, 'La auditoría tardó demasiado'), readerLimits.answerMs).unref();
        worker.postMessage({ id, request });
      });
    },
    close: async () => {
      closing = true;
      await worker.terminate();
    },
    // Solo para las pruebas: el hilo de ahora, para cerrarlo de golpe.
    thread: () => worker,
  };
}
