// El transporte directo por el Wi-Fi (diseño de 03, § 4.2): la computadora ofrece y el celular
// responde, cada uno con sus direcciones del Wi-Fi juntas en un solo mensaje y filtradas. Un solo
// lado decide que falló: el que ofrece, si el canal no abre en 5 s. Abierto, ICE comprueba la
// conexión solo; si queda cortada más de 5 s, o falla, el transporte se cierra con `lost`.
import { filterCandidates, fingerprintOf } from '@ferrebress/shared/peer/candidates';
import { platformSettings } from '../settings.ts';
import type { RtcChannel, RtcConnection } from './rtc.ts';
import { createTransport } from './transport.ts';

type Options = {
  connection: RtcConnection;
  // Cómo le llega al otro la oferta o la respuesta (por el servidor, § 4.4).
  signal(kind: 'offer' | 'answer', sdp: string): Promise<void>;
};

// El transporte sobre la conexión: el canal que crea o recibe, cuándo abre y cuándo se corta.
function watch(connection: RtcConnection) {
  let channel: RtcChannel | undefined;
  const opened = Promise.withResolvers<boolean>();
  const base = createTransport(
    'direct',
    (text) => channel?.send(text),
    () => connection.close(),
  );
  let lostTimer: ReturnType<typeof setTimeout> | undefined;
  let ice: RTCIceConnectionState = 'new';
  connection.onChannel((created) => {
    channel = created;
    created.onMessage(base.deliver);
    created.onOpen(() => opened.resolve(true));
    created.onClose(() => base.transport.close('lost'));
  });
  connection.onState((state) => {
    ice = state;
    clearTimeout(lostTimer);
    if (state === 'failed') base.transport.close('lost');
    if (state === 'disconnected')
      lostTimer = setTimeout(
        () => base.transport.close('lost'),
        platformSettings.direct.lostAfterMs,
      );
  });
  base.transport.onClose(() => opened.resolve(false));
  return { base, opened, ice: () => ice };
}

export function createDirect({ connection, signal }: Options) {
  const { base, opened, ice } = watch(connection);

  const described = async () => {
    await connection.gathered(platformSettings.direct.quietMs, platformSettings.direct.capMs);
    return filterCandidates(connection.localDescription());
  };

  return {
    transport: base.transport,
    // La computadora: ofrece y espera que el canal abra; si no abre a tiempo, se cierra con `failed`.
    async offer(): Promise<boolean> {
      await connection.offer();
      await signal('offer', await described());
      const timer = setTimeout(
        () => base.transport.close('failed'),
        platformSettings.direct.openWithinMs,
      );
      const ok = await opened.promise;
      clearTimeout(timer);
      return ok;
    },
    // El celular: responde la oferta; el canal abre cuando la computadora acepta.
    async answer(remote: string): Promise<boolean> {
      await connection.answer(remote);
      await signal('answer', await described());
      return opened.promise;
    },
    accept: (remote: string) => connection.accept(remote),
    // La huella DTLS propia, la que la confirmación del otro compara (§ 7).
    fingerprint: () => fingerprintOf(connection.localDescription()),
    roundTripMs: () => connection.roundTripMs(),
    // Para el aviso de por qué no se logró (§ 15.2): el estado de ICE y cuántas direcciones mandó.
    ice,
  };
}

export type Direct = ReturnType<typeof createDirect>;
