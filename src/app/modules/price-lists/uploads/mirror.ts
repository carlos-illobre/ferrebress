// El espejo de las listas que se suben (08 · R1.6, E08; diseño de 08, § 6): cada dispositivo pone las
// suyas en su valor con nombre, y el otro las ve. Mientras el archivo sube, el otro dice «Subiendo en
// la computadora» con su avance; cuando la lista ya existe en el servidor, la sigue como si fuera
// suya (su estado y el tema), así cualquiera de los dos responde lo que pregunta.
import * as z from 'zod/mini';
import { isPhone } from '../../../platform/device/device.ts';
import { mirror } from '../../../platform/mirror/registry.ts';
import { listsApi } from '../api.ts';
import type { Side, Upload } from './rules.ts';
import { find, listen, patch, stateArrived, uploads } from './store.ts';

const shared = z.array(
  z.object({
    key: z.string().check(z.maxLength(20)),
    fileName: z.string().check(z.maxLength(200)),
    // El avance de la subida, de a 10 %: cada cambio viaja.
    sent: z.number().check(z.minimum(0), z.maximum(100)),
    listId: z.nullable(z.string().check(z.maxLength(40))),
  }),
);
type Shared = z.infer<typeof shared>;

// Las que sube este dispositivo y todavía se suben o se leen.
export function ownOf(all: readonly Upload[]): Shared {
  return all
    .filter((upload) => !upload.from && (upload.phase === 'sending' || upload.phase === 'reading'))
    .map((upload) => ({
      key: upload.key,
      fileName: upload.fileName,
      sent: Math.floor((upload.sent / Math.max(upload.bytes, 1)) * 10) * 10,
      listId: upload.listId ?? null,
    }));
}

// Lo que llegó del otro: las que se suben, con su avance; una que ya existe se sigue por el tema.
export async function arrived(others: Shared, from: Side) {
  const keys = new Set(others.map((one) => `${from}:${one.key}`));
  // Una que el otro dejó de subir antes de que existiera (la canceló): se va.
  uploads.set(uploads.get().filter((one) => one.from !== from || one.listId || keys.has(one.key)));
  for (const one of others) {
    const key = `${from}:${one.key}`;
    const known = find(key);
    if (!known) uploads.set([...uploads.get(), remoteOf(key, one, from)]);
    else if (!known.listId) patch(key, { sent: one.sent });
    if (one.listId && !known?.listId) await follow(key, one.listId);
  }
}

const remoteOf = (key: string, one: Shared[number], from: Side): Upload => ({
  ...{ key, fileName: one.fileName, bytes: 100, sent: one.sent, scope: 'full' },
  ...{ phase: 'sending', from },
});

async function follow(key: string, listId: string) {
  patch(key, { listId, phase: 'reading' });
  const result = await listsApi.one(listId);
  if (!result.ok || !find(key)) return;
  stateArrived(key, result.data);
  listen(key, listId);
}

const sides: Record<string, [Side, Side]> = {
  true: ['phone', 'computer'],
  false: ['computer', 'phone'],
};

// Al arrancar: cada lado escribe el suyo y escucha el del otro.
export function watchUploads(phone = isPhone()) {
  const [side, other] = sides[String(phone)] as [Side, Side];
  const mine = mirror.register(`price-lists.uploads.${side}`, [] as Shared, shared);
  const theirs = mirror.register(`price-lists.uploads.${other}`, [] as Shared, shared);
  let last = '';
  uploads.subscribe((all) => {
    const now = ownOf(all);
    if (JSON.stringify(now) === last) return;
    last = JSON.stringify(now);
    mine.set(now);
  });
  theirs.subscribe((others) => void arrived(others, other));
}
