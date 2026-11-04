// El tema `sign-in.codes` del canal común (diseño de 01, § 5, y de 03, § 3.1): lo que espera la
// entrada de una computadora. Escucha solo quien tiene la cookie de su pantalla, sin sesión. Al
// escucharlo, la pantalla recibe un código nuevo cada 60 s mientras nadie lo leyó, y lo que pasa con
// la reserva: «leído», «cancelado» y el permiso. Una pantalla tiene un solo oyente: uno nuevo (la
// pestaña que se reconecta) reemplaza al anterior; cuando ya no la escucha nadie, se cierra.
import * as z from 'zod/mini';
import type { SignInContext } from '../../context.ts';
import { codeSettings } from '../../settings.ts';
import { screenOf } from './computer-routes.ts';
import type { Screen, ScreenEvent } from './screens.ts';

export const codesTopic = 'sign-in.codes';

const screenEvent = z.union([
  z.object({ type: z.literal('code'), code: z.string() }),
  z.object({ type: z.enum(['read', 'cancelled']) }),
  z.object({ type: z.literal('approved'), permit: z.string() }),
]);

// Mientras la escuchen: le manda el código vigente, uno nuevo al vencer, y cancela la reserva
// vencida. Termina cuando la deja de escuchar ese oyente (otro la reemplazó o se cerró el canal).
async function serve(ctx: SignInContext, screen: Screen, send: (event: ScreenEvent) => void) {
  const now = () => ctx.platform.clock.now().getTime();
  let stopped = false;
  // Despierta la espera antes de tiempo: «No soy yo», o el oyente que se va.
  let nudge = Promise.withResolvers<void>();
  screen.notify = (event) => {
    send(event);
    if (event.type === 'cancelled') nudge.resolve();
  };
  const channel = {
    stop: () => {
      stopped = true;
      nudge.resolve();
    },
  };
  const replaced = screen.channel;
  screen.channel = channel;
  replaced?.stop();
  while (!stopped) {
    if (ctx.screens.expireReservation(screen)) send({ type: 'cancelled' });
    if (!screen.reservation) send({ type: 'code', code: ctx.screens.newCode(screen) });
    const until = screen.reservation?.until ?? now() + codeSettings.codeTtlMs;
    await Promise.race([nudge.promise, ctx.wait(until - now())]);
    nudge = Promise.withResolvers<void>();
  }
}

export function defineCodesTopic(ctx: SignInContext): void {
  const { realtime } = ctx.platform;
  realtime.topic({
    name: codesTopic,
    param: z.string().check(z.maxLength(64)),
    event: screenEvent,
    anonymous: true,
    authorize: ({ request }) => {
      const screen = request && screenOf(ctx, request);
      return screen ? { key: screen.id } : { refused: 'not-found' };
    },
    onSubscribe: (key, send) => {
      void serve(ctx, ctx.screens.get(key) as Screen, send);
    },
    onUnsubscribe: (key) => {
      if (realtime.listeners(codesTopic, key) > 0) return;
      ctx.screens.get(key)?.channel?.stop();
      ctx.screens.close(key);
    },
  });
}
