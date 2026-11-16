// Subir una lista (08 · R4.1, R4.2; diseño de 08, § 3): el archivo llega como flujo y va al almacén
// sin tenerlo entero en memoria, contando los bytes; pasado el tope o sin datos por un rato, se corta.
// Recién guardado se mira su formato; si no sirve, se borra, salvo que otra lista tenga el mismo
// contenido.
import type { Context } from 'hono';
import type { FileStore, Stored } from '../../../platform/storage/files.ts';
import { formatFits } from '../rules/format.ts';

// Las partes del cuerpo, cortando si no llega nada por `idleMs`; las primeras, guardadas en `head`.
async function* body(c: Context, idleMs: number, head: { bytes: Uint8Array }) {
  const reader = (c.req.raw.body as ReadableStream<Uint8Array>).getReader();
  try {
    for (;;) {
      let timer: NodeJS.Timeout | undefined;
      const idle = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('sin datos')), idleMs);
      });
      const part = await Promise.race([reader.read(), idle]).finally(() => clearTimeout(timer));
      if (part.done) return;
      if (head.bytes.length < 8)
        head.bytes = Uint8Array.from([...head.bytes, ...part.value.slice(0, 8)]);
      yield part.value;
    }
  } finally {
    reader.releaseLock();
  }
}

export type Received = Stored | 'too-big' | 'format' | 'cut';

export async function receive(
  c: Context,
  files: FileStore,
  options: {
    name: string;
    maxBytes: number;
    idleMs: number;
    used: (sha: string) => Promise<boolean>;
  },
): Promise<Received> {
  const head = { bytes: new Uint8Array() };
  let stored: Stored | 'too-big';
  try {
    stored = await files.save(body(c, options.idleMs, head), options.maxBytes);
  } catch {
    return 'cut';
  }
  if (stored === 'too-big') return stored;
  if (formatFits(options.name, head.bytes)) return stored;
  if (!(await options.used(stored.sha256))) await files.remove(stored.sha256);
  return 'format';
}
