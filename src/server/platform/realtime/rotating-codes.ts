// Los códigos que una pantalla muestra en un QR mientras alguien la escucha (diseño de 03, § 10.3): 128
// bits al azar, uno nuevo cada tanto, del que vale solo el último y que sirve una vez. Lo común a
// cualquier código de un QR: quién lo muestra y para qué lo decide quien lo usa. Sin negocio.
import { randomBytes } from 'node:crypto';

type Options = { ttlMs: number; wait: (ms: number) => Promise<void>; now: () => number };
type Code = { owner: string; expiresAt: number; used: boolean };
export type CodeOutcome = { owner: string } | 'code-expired' | 'code-used';

// Llama a `tick` ahora y cada `ttlMs` hasta que se llame a lo que devuelve.
function rotate(tick: () => void, wait: (ms: number) => Promise<void>, ttlMs: number) {
  const stopped = Promise.withResolvers<void>();
  let running = true;
  void (async () => {
    while (running) {
      tick();
      await Promise.race([stopped.promise, wait(ttlMs)]);
    }
  })();
  return () => {
    running = false;
    stopped.resolve();
  };
}

// Los códigos emitidos y el último de cada dueño: emitir, mirar y gastar.
function createBook(ttlMs: number, now: () => number) {
  const codes = new Map<string, Code>();
  const latest = new Map<string, string>();
  const sweep = () => {
    for (const [code, entry] of codes) if (entry.expiresAt + ttlMs < now()) codes.delete(code);
  };
  // Qué pasa con un código leído: de quién es, o por qué ya no sirve.
  const peek = (code: string): CodeOutcome => {
    const entry = codes.get(code);
    if (!entry || entry.expiresAt <= now() || latest.get(entry.owner) !== code)
      return 'code-expired';
    return entry.used ? 'code-used' : { owner: entry.owner };
  };
  return {
    issue(owner: string): string {
      sweep();
      const code = randomBytes(16).toString('base64url');
      codes.set(code, { owner, expiresAt: now() + ttlMs, used: false });
      latest.set(owner, code);
      return code;
    },
    peek,
    take(code: string): CodeOutcome {
      const outcome = peek(code);
      if (typeof outcome !== 'string') (codes.get(code) as Code).used = true;
      return outcome;
    },
    forget: (owner: string) => void latest.delete(owner),
  };
}

export function createRotatingCodes({ ttlMs, wait, now }: Options) {
  const book = createBook(ttlMs, now);
  const stops = new Map<string, () => void>();
  const stop = (owner: string): void => {
    stops.get(owner)?.();
    stops.delete(owner);
    book.forget(owner);
  };
  return {
    // Empieza a mandarle códigos a quien los muestra, uno nuevo al vencer, hasta `stop`. Uno nuevo
    // del mismo dueño reemplaza al anterior.
    start(owner: string, send: (code: string) => void): void {
      stop(owner);
      stops.set(
        owner,
        rotate(
          () => send(book.issue(owner)),
          (ms) => wait(ms),
          ttlMs,
        ),
      );
    },
    peek: book.peek,
    // Lo gasta: desde ahora, leerlo de nuevo da `code-used`.
    take: book.take,
    stop,
  };
}

export type RotatingCodes = ReturnType<typeof createRotatingCodes>;
