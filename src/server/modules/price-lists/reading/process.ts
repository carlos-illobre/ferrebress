// La entrada del proceso lector (ADR-021): recibe un trabajo por vez y cuenta lo que pasa. No recibe
// ninguna variable de entorno (la clave de la base no llega) y tiene tope de memoria: el del motor y,
// como un ZIP se descomprime fuera de él, el de todo el proceso, que se mira cada 100 ms entre una cosa
// y otra (no mientras SheetJS abre un Excel: ahí el tope es el índice del ZIP, zip.ts). Queda fuera
// de la cobertura: la lógica está en job.ts, que se prueba en el mismo proceso.

import { writeFileSync } from 'node:fs';
import { runJob } from './job.ts';
import type { Job, JobMessage } from './messages.ts';

// Si el contenedor se queda sin memoria, que muera el proceso lector y no el servidor. Subirlo no pide
// privilegios; fuera de Linux no existe y no importa.
try {
  writeFileSync('/proc/self/oom_score_adj', '1000');
} catch {}

const limitBytes = Number(process.argv[2]) * 2 ** 20;
setInterval(() => {
  if (process.memoryUsage.rss() > limitBytes) process.exit(137);
}, 100).unref();

// Espera a que el mensaje salga antes de seguir: si no, los bloques leídos se juntan en la memoria del
// proceso mientras el servidor guarda los anteriores.
const send = (message: JobMessage) =>
  new Promise<void>((resolve) => {
    process.send?.(message, undefined, undefined, () => resolve());
  });

process.on('message', (job: Job) => {
  runJob(job, send).catch(() => send({ type: 'failed', reason: 'damaged' }));
});
process.on('disconnect', () => process.exit(0));
