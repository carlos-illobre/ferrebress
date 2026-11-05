// Arrancar el vínculo de esta pestaña (diseño de 03, § 11.1): el diario, la tira de cada persona, el
// vínculo vivo y lo que escucha de la aplicación. Se baja aparte del arranque: no hace falta para
// dibujar la primera pantalla.

import type { PairingView } from '@ferrebress/shared/contracts/pairing';
import { mirror } from '../../platform/mirror/registry.ts';
import { bindRoute } from '../../platform/mirror/route.ts';
import { createRtcConnection } from '../../platform/peer/rtc.ts';
import { realtime } from '../../platform/realtime/channel.ts';
import {
  api,
  appVersion,
  decorate,
  newVersion,
  online,
  sessionClosed,
} from '../../platform/server/api.ts';
import { serverNow } from '../../platform/server/clock.ts';
import { onField } from '../../platform/server/fields.ts';
import { startParts } from '../../platform/server/start-parts.ts';
import { person } from '../sign-in/index.ts';
import { linkOver, linkRuntime, linkStrip } from './current.ts';
import { reading } from './detail.ts';
import { createJournal } from './journal.ts';
import { takePairCode } from './pair.ts';
import { watchReplaced } from './replaced.ts';
import { pairingShape } from './runtime/topic.ts';
import { createRuntime } from './runtime.ts';
import { Layer } from './screens/Detail/Over.tsx';
import { createStrip, type Strip } from './strip.ts';
import { createTabs } from './tabs.ts';
import type { Watched } from './watch.ts';
import { watchLink } from './watch.ts';

// Quién tiene la sesión, solo su identificador. Una sesión cerrada o vencida (la entrada encima de lo
// que había) ya no es de nadie: el vínculo la suelta en el momento, sin esperar la confirmación (R2.6).
export const who: Watched<string | undefined> = {
  get: () => (sessionClosed.get() ? undefined : person.get()?.userId),
  subscribe(listener) {
    const tell = () => listener(who.get());
    const stops = [person.subscribe(tell), sessionClosed.subscribe(tell)];
    return () => {
      for (const stop of stops) stop();
    };
  },
};

// El vínculo que dijo `/api/start`, validado: lo que no tiene su forma cuenta como «ninguno».
const atStart: Watched<PairingView | null | undefined> = {
  get: () => pairingAt(startParts.get()),
  subscribe: (listener) => startParts.subscribe((parts) => listener(pairingAt(parts))),
};
export function pairingAt(parts: Record<string, unknown> | undefined) {
  if (!parts) return undefined;
  const parsed = pairingShape.safeParse(parts.pairing);
  return parsed.success ? parsed.data : null;
}

// La tira es de cada persona (R4.4): una por quien tenga la sesión.
export function stripOfPerson(): () => Strip | undefined {
  let current: { owner: string; strip: Strip } | undefined;
  const now = () => serverNow()?.getTime() ?? Date.now();
  return () => {
    const owner = who.get();
    if (!owner) return undefined;
    if (current?.owner !== owner) current = { owner, strip: createStrip({ owner, now }) };
    return current.strip;
  };
}

export function startDeviceLink(): () => void {
  const journal = createJournal();
  const strip = stripOfPerson();
  linkStrip.set({ of: strip });
  linkOver.set({ Over: Layer });
  const code = takePairCode(who.get() !== undefined);
  if (code) reading.set({ code });
  const runtime = createRuntime({
    api,
    want: realtime.want,
    mirror,
    rtc: createRtcConnection,
    online,
    appVersion,
    outdated: newVersion.get,
    journal,
    strip,
  });
  linkRuntime.set(runtime);
  // La dirección viaja al otro mientras espejan (diseño de 03, § 5.4).
  const unbindRoute = bindRoute(mirror);
  const stopReplaced = watchReplaced(runtime);
  const stop = watchLink({
    runtime,
    who,
    atStart,
    onField,
    decorate,
    tabs: (onChange) => createTabs({ onChange }),
    visible: () => document.visibilityState === 'visible',
  });
  return () => {
    stop();
    runtime.stop();
    journal.stop();
    unbindRoute();
    stopReplaced();
    linkRuntime.set(undefined);
    linkOver.set(undefined);
  };
}
