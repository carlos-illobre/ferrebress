// Los procesos lectores (diseño de 08, § 7; ADR-021): unos pocos procesos vivos que se reusan, cada uno
// con un trabajo por vez; los demás esperan en la cola. Uno que muere, se pasa de memoria o no dice
// nada por mucho tiempo se termina y se reemplaza, y su lista queda con el motivo `crashed`. Cancelar
// una lista que se lee termina su proceso: así seguro no sigue.
import { type ChildProcess, fork } from 'node:child_process';
import type { Job, JobMessage } from './messages.ts';

export type PoolOptions = {
  processes: number;
  // El tope de memoria de cada proceso, en MB: de todo el proceso y del motor de JavaScript.
  memoryMb: number;
  heapMb: number;
  // Cuánto puede pasar sin que el proceso diga nada antes de darlo por colgado.
  stallMs: number;
};

type Task = { job: Job; onMessage: (message: JobMessage) => void; finish: () => void };
type Worker = { child: ChildProcess; task?: Task | undefined; timer?: NodeJS.Timeout };
type Events = { received(worker: Worker, message: JobMessage): void; died(worker: Worker): void };

const ends = new Set<JobMessage['type']>(['done', 'failed', 'size']);
const entry = new URL('./process.ts', import.meta.url);

// Un proceso nuevo, sin el entorno del servidor (la clave de la base no llega).
function spawn(options: PoolOptions, events: Events): Worker {
  const child = fork(entry, [String(options.memoryMb)], {
    env: {},
    execArgv: [`--max-old-space-size=${options.heapMb}`],
    serialization: 'advanced',
    stdio: ['ignore', 'ignore', 'inherit', 'ipc'],
  });
  const worker: Worker = { child };
  child.on('message', (message: JobMessage) => events.received(worker, message));
  child.on('exit', () => events.died(worker));
  return worker;
}

// Si no dice nada en el plazo, se lo termina: queda como muerto.
function watch(worker: Worker, stallMs: number) {
  clearTimeout(worker.timer);
  worker.timer = setTimeout(() => worker.child.kill('SIGKILL'), stallMs);
}

// Termina el trabajo de un proceso, con o sin un último aviso.
function release(worker: Worker, last?: JobMessage) {
  clearTimeout(worker.timer);
  const task = worker.task;
  worker.task = undefined;
  if (last) task?.onMessage(last);
  task?.finish();
}

export function createReadingPool(options: PoolOptions) {
  const queue: Task[] = [];
  const workers: Worker[] = [];
  let closed = false;

  const next = () => {
    for (const worker of workers) {
      if (worker.task || queue.length === 0) continue;
      worker.task = queue.shift() as Task;
      worker.child.send(worker.task.job);
      watch(worker, options.stallMs);
    }
  };
  const events: Events = {
    // Un proceso habla solo mientras tiene un trabajo.
    received(worker, message) {
      (worker.task as Task).onMessage(message);
      if (!ends.has(message.type)) return watch(worker, options.stallMs);
      release(worker);
      next();
    },
    // Murió o se lo terminó: su lista queda cortada, y otro ocupa su lugar.
    died(worker) {
      clearTimeout(worker.timer);
      workers.splice(workers.indexOf(worker), 1);
      if (closed) return;
      workers.push(spawn(options, events));
      release(worker, { type: 'failed', reason: 'crashed' });
      next();
    },
  };
  for (let i = 0; i < options.processes; i++) workers.push(spawn(options, events));

  return {
    read: (job: Job, onMessage: (message: JobMessage) => void) =>
      enqueue({ queue, workers, next }, job, onMessage),
    // Cuántas esperan en la cola, y los procesos vivos: para mirar el servidor.
    waiting: () => queue.length,
    processIds: () => workers.map((worker) => worker.child.pid as number),
    close() {
      closed = true;
      for (const worker of workers) worker.child.kill('SIGKILL');
    },
  };
}

// Lee una lista; lo que va pasando llega a `onMessage`. `cancel` la saca de la cola o termina su
// proceso, sin avisar nada más.
function enqueue(
  pool: { queue: Task[]; workers: Worker[]; next: () => void },
  job: Job,
  onMessage: (message: JobMessage) => void,
) {
  const { promise: finished, resolve: finish } = Promise.withResolvers<void>();
  const task: Task = { job, onMessage, finish };
  pool.queue.push(task);
  pool.next();
  return {
    finished,
    cancel() {
      task.onMessage = () => {};
      const waiting = pool.queue.indexOf(task);
      if (waiting >= 0) {
        pool.queue.splice(waiting, 1);
        task.finish();
      }
      pool.workers.find((worker) => worker.task === task)?.child.kill('SIGKILL');
    },
  };
}

export type ReadingPool = ReturnType<typeof createReadingPool>;
