// La llave de prueba de la sesión (ADR-015): un par de llaves que el navegador crea y que no se
// pueden exportar. La privada queda en IndexedDB y firma lo que se manda cuando la cookie no
// sirve (una salida pendiente; en el módulo 15, lo hecho sin conexión); el servidor guarda la
// pública. Un código malicioso en la página podría usarla mientras está abierta, pero no copiarla.
import { product } from '@ferrebress/shared/contracts/product';

const database = product.id;
const table = 'keys';
const key = 'proof';
const algorithm = { name: 'ECDSA', namedCurve: 'P-256' } as const;

// Un pedido de IndexedDB como promesa.
const settled = <T>(pending: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    pending.onsuccess = () => resolve(pending.result);
    pending.onerror = () => reject(pending.error);
  });

async function request<T>(
  run: (store: IDBObjectStore) => IDBRequest<T>,
  mode: IDBTransactionMode,
): Promise<T> {
  const open = indexedDB.open(database, 1);
  open.onupgradeneeded = () => open.result.createObjectStore(table);
  const db = await settled(open);
  return settled(run(db.transaction(table, mode).objectStore(table)));
}

const base64url = (buffer: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

// Crea la llave de una sesión nueva (pisa la anterior) y devuelve la parte pública, para el servidor.
export async function createProofKey(): Promise<string> {
  const pair = await crypto.subtle.generateKey(algorithm, false, ['sign', 'verify']);
  await request((store) => store.put(pair, key), 'readwrite');
  return base64url(await crypto.subtle.exportKey('spki', pair.publicKey));
}

// La firma de un mensaje con la llave de la sesión, o undefined si no hay llave.
export async function signWithProofKey(message: string): Promise<string | undefined> {
  const pair = await request<CryptoKeyPair | undefined>((store) => store.get(key), 'readonly');
  if (!pair) return undefined;
  const data = new TextEncoder().encode(message);
  return base64url(
    await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, pair.privateKey, data),
  );
}

export async function forgetProofKey(): Promise<void> {
  await request((store) => store.delete(key), 'readwrite');
}
