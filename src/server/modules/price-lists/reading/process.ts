// La entrada del proceso lector (ADR-021): recibe un trabajo por vez y cuenta lo que pasa. No recibe
// ninguna variable de entorno (la clave de la base no llega) y tiene tope de memoria: el del motor y,
// como un ZIP se descomprime fuera de él, el de todo el proceso, que se mira cada 100 ms. Queda fuera
// de la cobertura: la lógica está en job.ts, que se prueba en el mismo proceso.

import { runJob } from './job.ts';
import type { Job, JobMessage } from './messages.ts';

const limitBytes = Number(process.argv[2]) * 2 ** 20;
setInterval(() => {
  if (process.memoryUsage.rss() > limitBytes) process.exit(137);
}, 100).unref();

const send = (message: JobMessage) => process.send?.(message);

process.on('message', (job: Job) => {
  runJob(job, send).catch(() => send({ type: 'failed', reason: 'damaged' }));
});
process.on('disconnect', () => process.exit(0));
