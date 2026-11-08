// La lógica de Administración (diseño de 06, § 7): los ajustes que trae el servidor, el ajuste
// elegido, guardar al cambiar con «Deshacer», el choque con otro, la confirmación del redondeo, el
// permiso y sin conexión. Lo que se ve vive en valores con nombre, así el espejo lo copia al otro
// dispositivo vinculado; lo guardado entra en lo que trajo el servidor, que también viaja, así el
// otro lo ve también por el servidor (E08).
import type {
  AdministrationResponse,
  SettingKey,
  SettingState,
} from '@ferrebress/shared/contracts/administration';
import { can } from '@ferrebress/shared/contracts/can';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useMirroredQuery } from '../../platform/mirror/query.ts';
import { useMirrored } from '../../platform/mirror/use-mirrored.ts';
import { oneOf } from '../../platform/schema.ts';
import { online as onlineStore } from '../../platform/server/api.ts';
import { serverNow } from '../../platform/server/clock.ts';
import { useStore } from '../../platform/store.ts';
import { person as me } from '../sign-in/index.ts';
import { administrationApi } from './api.ts';
import { saving } from './saving.ts';
import { type Confirm, type Note, schemas } from './schemas.ts';

export type { Confirm, Note } from './schemas.ts';

import { type Panel, panels } from './texts.ts';

// Lo último que se vio, de esa persona, en esta sesión de la aplicación (no se guarda en el
// dispositivo).
const lastSeen = new WeakMap<object, { data: AdministrationResponse; at: Date }>();

// Lo que se ve: lo que trae el servidor y los valores con nombre, que el espejo copia al otro
// dispositivo vinculado.
function useShown() {
  const query = useMirroredQuery('administration', administrationApi.settings, [], {
    mode: 'forward',
    schema: schemas.response,
  });
  const preview = useMirroredQuery('administration-rounding', administrationApi.rounding, [], {
    mode: 'forward',
    schema: schemas.rounding,
  });
  const [panel, setPanel] = useMirrored<Panel>(
    'administration.panel',
    'roundingStep',
    oneOf(panels),
  );
  const [said, setSaid] = useMirrored<Note | null>('administration.note', null, schemas.note);
  const [asked, setAsked] = useMirrored<Confirm | null>(
    'administration.confirm',
    null,
    schemas.confirm,
  );
  return { query, preview, panel, setPanel, said, setSaid, asked, setAsked };
}

export function useAdministration() {
  const { query, preview, panel, setPanel, said, setSaid, asked, setAsked } = useShown();
  // local: la opción sobre la que pasa el mouse es del dispositivo que tiene el mouse.
  const [looking, setLooking] = useState<{ key: SettingKey; value: number } | undefined>();
  const who = useStore(me);
  const online = useStore(onlineStore);
  const canChange = !!who && can(who, 'settings.change');
  const editable = canChange && online && !!query.data;

  // Lo de ahora, también para un «Deshacer» que se toca después de otro cambio.
  const latest = useRef(query.data);
  latest.current = query.data;
  const update = useRef(query.update);
  update.current = query.update;

  const put = (key: SettingKey, state: SettingState) =>
    update.current((now) => ({ ...now, settings: { ...now.settings, [key]: state } }));
  const save = saving({
    ...{ latest, put, editable, asked, setSaid, setAsked },
    refreshPrices: preview.invalidate,
  });

  // Un paso nuevo del redondeo: pregunta el servidor si cambian precios (R3.4).
  const chooseStep = (step: number) => void save('roundingStep', step);

  // Lo último que se vio, para volver a mostrarlo sin conexión (R1.6, E06).
  useEffect(() => {
    if (query.data) lastSeen.set(who as object, { data: query.data, at: serverNow() as Date });
  }, [query.data]);

  return {
    ...{ data: query.data ?? (query.failed ? lastSeen.get(who as object)?.data : undefined) },
    seenAt: lastSeen.get(who as object)?.at,
    ...{ fresh: !!query.data, failed: query.failed, retry: query.invalidate },
    ...{ prices: preview.data, panel, setPanel, said, asked, looking, setLooking },
    ...{ canChange, editable, online, save, chooseStep },
    cancel: () => setAsked(null),
    confirmStep: () =>
      void save('roundingStep', (asked as Confirm).step, (asked as Confirm).prices),
  };
}

export type Administration = ReturnType<typeof useAdministration>;
