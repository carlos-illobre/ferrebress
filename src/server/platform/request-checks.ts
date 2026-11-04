// Los pasos que un módulo suma a todos los pedidos de /api, antes de cualquier ruta (diseño de 03,
// § 7.2): la plataforma los corre en orden y el primero que contesta corta el pedido. Así un módulo
// que se registra último igual cuida las rutas de los demás, sin que ellas lo sepan.
import type { Context } from 'hono';

export type RequestCheck = (c: Context) => Promise<Response | undefined>;

export function createRequestChecks() {
  const checks: RequestCheck[] = [];
  return {
    add: (check: RequestCheck) => void checks.push(check),
    async run(c: Context): Promise<Response | undefined> {
      for (const check of checks) {
        const refused = await check(c);
        if (refused) return refused;
      }
      return undefined;
    },
  };
}

export type RequestChecks = ReturnType<typeof createRequestChecks>;
