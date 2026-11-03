// El hilo de lectura de la auditoría (reader.ts): contesta cada consulta con los archivos del disco,
// de solo lectura, de a una por vez.
import { parentPort, workerData } from 'node:worker_threads';
import { createQuery } from './query.ts';
import { fileSource } from './source.ts';

const query = createQuery(fileSource((workerData as { path: string }).path), () =>
  new Date().getUTCFullYear(),
);

parentPort?.on('message', ({ id, request }) => {
  try {
    parentPort?.postMessage({ id, answer: query(request) });
  } catch (error) {
    parentPort?.postMessage({ id, error: String(error) });
  }
});
