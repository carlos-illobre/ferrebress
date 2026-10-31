// La sesión del pedido, para cualquier módulo (diseño de 02, § 3): el módulo que sabe de sesiones
// (sign-in) da cómo se resuelve; la plataforma da el paso `require`, que la deja en el pedido o
// contesta lo que contestó quien resuelve (la sesión cerrada, demasiados intentos). Así un módulo sabe
// quién pregunta sin importar a sign-in.
import type { Context, MiddlewareHandler } from 'hono';

// `confirmedAt`: la última vez que pasó por Google o por la huella en esta sesión (02 · R3.8).
export type RequestSession = {
  id: string;
  userId: string;
  deviceId: string;
  confirmedAt: Date | null;
};

type Resolve = (c: Context) => Promise<RequestSession | Response>;

export function createSessionGate() {
  let resolve: Resolve = async () => {
    throw new Error('Nadie dio cómo se resuelve la sesión');
  };
  const require: MiddlewareHandler = async (c, next) => {
    const session = await resolve(c);
    if (session instanceof Response) return session;
    c.set('session', session);
    await next();
  };
  return {
    provide: (given: Resolve) => {
      resolve = given;
    },
    require,
  };
}

export type SessionGate = ReturnType<typeof createSessionGate>;

// La sesión que dejó `require` en el pedido.
export const sessionOf = (c: Context): RequestSession => c.get('session') as RequestSession;
