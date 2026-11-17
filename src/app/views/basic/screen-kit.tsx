// Montar una pantalla sola para sus pruebas: la hora del servidor, con conexión, quién la mira, un
// servidor de mentira con las respuestas de la prueba y las tostadas debajo.
import { render } from '@testing-library/preact';
import type { FunctionComponent } from 'preact';
import { person as me } from '../../modules/sign-in/index.ts';
import { online } from '../../platform/server/api.ts';
import { syncServerTime } from '../../platform/server/clock.ts';
import { fakeServer, type Reply } from '../../testing/fake-server.ts';
import { Toasts } from './ui/toast/Toast.tsx';

export type Who = Parameters<typeof me.set>[0];

export function mountScreen(
  Screen: FunctionComponent,
  { routes, who, now }: { routes: Record<string, Reply | Reply[]>; who: Who; now: number },
) {
  syncServerTime(now);
  online.set(true);
  me.set(who);
  const server = fakeServer(routes);
  render(
    <>
      <div id="app" data-layer="">
        <Screen />
      </div>
      <Toasts />
    </>,
  );
  return server;
}
