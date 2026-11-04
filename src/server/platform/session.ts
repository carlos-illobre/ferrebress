// La sesión del pedido, para cualquier módulo (diseño de 02, § 3): el módulo que sabe de sesiones
// (sign-in) da cómo se resuelve; la plataforma da el paso `require`, que la deja en el pedido o
// contesta lo que contestó quien resuelve (la sesión cerrada, demasiados intentos). Así un módulo sabe
// quién pregunta sin importar a sign-in. También avisa cuándo termina una sesión y si sigue abierta
// (diseño de 03, § 3.3): el canal en tiempo real cierra lo de una sesión que terminó.
import type { Context, MiddlewareHandler } from 'hono';

// `confirmedAt`: la última vez que pasó por Google o por la huella en esta sesión (02 · R3.8).
export type RequestSession = {
  id: string;
  userId: string;
  deviceId: string;
  confirmedAt: Date | null;
};

// Por qué terminó una sesión, con los nombres de sign-in (01 · R3).
export type EndedReason = 'sign-out' | 'revoked' | 'deactivated' | 'idle' | 'max-age';
export type EndedSession = { id: string; userId: string };

type Resolve = (c: Context) => Promise<RequestSession | Response>;

// Lo que se hace con la sesión ya resuelta, antes de la ruta: los permisos la usan para dejar su
// huella en la cabecera de cualquier respuesta con sesión (diseño de 02, § 20).
type OnSession = (c: Context, session: RequestSession) => Promise<void>;
type OnEnded = (session: EndedSession, reason: EndedReason) => void;

export function createSessionGate() {
  let resolve: Resolve = async () => {
    throw new Error('Nadie dio cómo se resuelve la sesión');
  };
  // Si una sesión sigue abierta, mirado en memoria: lo da sign-in; sin él, todas lo están.
  let isOpen: (sessionId: string) => boolean = () => true;
  const hooks: OnSession[] = [];
  const endedListeners: OnEnded[] = [];
  const require: MiddlewareHandler = async (c, next) => {
    const session = await resolve(c);
    if (session instanceof Response) return session;
    c.set('session', session);
    for (const hook of hooks) await hook(c, session);
    await next();
  };
  return {
    provide: (given: Resolve, open?: (sessionId: string) => boolean) => {
      resolve = given;
      if (open) isOpen = open;
    },
    onSession: (hook: OnSession) => void hooks.push(hook),
    require,
    // La sesión del pedido si hay una abierta; si no, ninguna, sin contestar nada: para lo que se
    // puede usar con sesión o sin ella (el canal en tiempo real con temas anónimos).
    async identify(c: Context): Promise<RequestSession | undefined> {
      const session = await resolve(c);
      return session instanceof Response ? undefined : session;
    },
    isOpen: (sessionId: string) => isOpen(sessionId),
    // sign-in avisa cada sesión que termina, por el motivo que sea; quien escucha no la conoce.
    ended(session: EndedSession, reason: EndedReason): void {
      for (const listener of endedListeners) listener(session, reason);
    },
    onEnded: (listener: OnEnded) => void endedListeners.push(listener),
  };
}

export type SessionGate = ReturnType<typeof createSessionGate>;

// La sesión que dejó `require` en el pedido.
export const sessionOf = (c: Context): RequestSession => c.get('session') as RequestSession;
