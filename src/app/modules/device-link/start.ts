// Arrancar el vínculo de esta pestaña (diseño de 03, § 11.1): el diario, la tira de cada persona, el
// vínculo vivo y lo que escucha de la aplicación. Se baja aparte del arranque: no hace falta para
// dibujar la primera pantalla.
import { mirror } from '../../platform/mirror/registry.ts';
import { createRtcConnection } from '../../platform/peer/rtc.ts';
import { realtime } from '../../platform/realtime/channel.ts';
import { api, appVersion, decorate, newVersion, online } from '../../platform/server/api.ts';
import { serverNow } from '../../platform/server/clock.ts';
import { onField } from '../../platform/server/fields.ts';
import type { Store } from '../../platform/store.ts';
import { person } from '../sign-in/index.ts';
import { linkRuntime } from './current.ts';
import { createJournal } from './journal.ts';
import { createRuntime } from './runtime.ts';
import { createStrip, type Strip } from './strip.ts';
import { createTabs } from './tabs.ts';
import { watchLink } from './watch.ts';

// Quién tiene la sesión, solo su identificador.
const who: Store<string | undefined> = {
  get: () => person.get()?.userId,
  set: () => undefined,
  subscribe: (listener) => person.subscribe((now) => listener(now?.userId)),
};

// La tira es de cada persona (R4.4): una por quien tenga la sesión.
function stripOfPerson(): () => Strip | undefined {
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
  const runtime = createRuntime({
    api,
    want: (token, handler) => realtime.want(token, handler),
    mirror,
    rtc: createRtcConnection,
    online,
    appVersion,
    outdated: () => newVersion.get(),
    journal,
    strip: stripOfPerson(),
  });
  linkRuntime.set(runtime);
  const stop = watchLink({
    runtime,
    who,
    onField,
    decorate,
    tabs: (onChange) => createTabs({ onChange }),
    visible: () => document.visibilityState === 'visible',
  });
  return () => {
    stop();
    runtime.stop();
    journal.stop();
    linkRuntime.set(undefined);
  };
}
