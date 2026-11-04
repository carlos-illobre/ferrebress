// Lo que los módulos suman a `/api/start` (diseño de 03, § 10.1): cada uno da su parte con un nombre y
// `/api/start` la manda, con sesión, en `parts`, sin conocer a ningún módulo. Así la aplicación sabe
// al abrir lo que necesita cada uno sin pedidos de más (el vínculo, por ejemplo).
import type { Context } from 'hono';

export type StartPart = (c: Context) => Promise<unknown>;

export function createStartParts() {
  const parts = new Map<string, StartPart>();
  return {
    contribute(name: string, part: StartPart): void {
      if (parts.has(name)) throw new Error(`La parte «${name}» de /api/start ya tiene dueño`);
      parts.set(name, part);
    },
    // Las partes de este pedido; la que no tiene nada que decir (`undefined`) no va.
    async collect(c: Context): Promise<Record<string, unknown>> {
      const entries = await Promise.all(
        [...parts].map(async ([name, part]) => [name, await part(c)] as const),
      );
      return Object.fromEntries(entries.filter(([, value]) => value !== undefined));
    },
  };
}

export type StartParts = ReturnType<typeof createStartParts>;
