// La lógica de Administración (diseño de 06, § 7): los ajustes que trae el servidor, el ajuste
// elegido, guardar al cambiar con «Deshacer», el choque con otro, la confirmación del redondeo, el
// permiso y sin conexión. Lo que se ve vive en valores con nombre, así el espejo lo copia al otro
// dispositivo vinculado; lo guardado entra en lo que trajo el servidor, que también viaja, así el
// otro lo ve también por el servidor (E08).
import {
  type AdministrationResponse,
  type SettingKey,
  type SettingState,
  type Settings,
  valuesOf,
} from '@ferrebress/shared/contracts/administration';
import { can } from '@ferrebress/shared/contracts/can';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useMirroredQuery } from '../../platform/mirror/query.ts';
import { useMirrored } from '../../platform/mirror/use-mirrored.ts';
import { oneOf } from '../../platform/schema.ts';
import { useScreen } from '../../platform/screens.ts';
import { online as onlineStore } from '../../platform/server/api.ts';
import { serverNow } from '../../platform/server/clock.ts';
import { useStore } from '../../platform/store.ts';
import { formatTime } from '../../platform/time.ts';
import { person as me } from '../sign-in/index.ts';
import { administrationApi } from './api.ts';
import { saving } from './saving.ts';
import { type Confirm, type Note, schemas } from './schemas.ts';
import { administrationSettings } from './settings.ts';

export type { Confirm, Note } from './schemas.ts';

import { type ListSetting, typedNumber } from './logic.ts';
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

// La hora del negocio, con el reloj del servidor (que ya se sabe: los ajustes llegaron de él), y se
// mueve sola sin pedidos (R5.1).
const serverDate = () => serverNow() as Date;
function useClock(): string {
  const [now, setNow] = useState(serverDate()); // local: la hora la mueve cada dispositivo
  useEffect(() => {
    const timer = setInterval(() => setNow(serverDate()), administrationSettings.clockMs);
    return () => clearInterval(timer);
  }, []);
  return formatTime(now);
}

// Sin el permiso: qué roles lo tienen (R1.2, E02). Lo pide cada dispositivo, con su sesión.
function useHolders(canChange: boolean): string {
  const [roles, setRoles] = useState(''); // local: lo pide cada dispositivo, con su sesión
  useEffect(() => {
    if (canChange) return;
    void administrationApi.holders().then((result) => {
      if (result.ok) setRoles(result.data.roles.map((role) => role.name).join(', '));
    });
  }, [canChange]);
  return roles;
}

type Shown = ReturnType<typeof useShown>;

// Guardar al cambiar (R2), sobre lo de ahora: también para un «Deshacer» que se toca después de otro
// cambio.
function useSave(shown: Shown, editable: boolean) {
  const { query, preview, asked, setSaid, setAsked } = shown;
  const latest = useRef(query.data);
  latest.current = query.data;
  const update = useRef(query.update);
  update.current = query.update;
  const put = (key: SettingKey, state: SettingState) =>
    update.current((now) => ({ ...now, settings: { ...now.settings, [key]: state } }));
  return saving({
    ...{ latest, put, editable, asked, setSaid, setAsked },
    refreshPrices: preview.invalidate,
  });
}

// Lo último que se vio, para volver a mostrarlo sin conexión (R1.6, E06).
function useLastSeen(who: object, data: AdministrationResponse | undefined) {
  useEffect(() => {
    if (data) lastSeen.set(who, { data, at: serverNow() as Date });
  }, [data]);
  return lastSeen.get(who);
}

// Elegir un ajuste para mirar (R1.8): su panel, y el cursor a sus opciones. Cuántas veces se eligió
// es de este dispositivo: la vista lleva el cursor cada vez, también cuando se eligió con el teclado.
function useChoose(setPanel: Shown['setPanel']) {
  const [chosen, setChosen] = useState(0); // local: el cursor es de este dispositivo
  const choose = (panel: Panel) => {
    setPanel(panel);
    setChosen((times) => times + 1);
  };
  return { chosen, choose };
}

// Lo escrito en una caja se guarda al salir, si cambió (diseño de 06, § 7): un margen rápido (R4) o
// un ajuste de las listas (R8).
// Las cajas se dibujan solo con los valores a la vista: `values` siempre está al escribir.
function typing(save: ReturnType<typeof useSave>, values: Settings | undefined) {
  const settings = values as Settings;
  return {
    typeSetting: (key: ListSetting, text: string) => {
      const typed = typedNumber(text);
      if (typed !== settings[key]) void save(key, typed);
    },
    typeMargin: (index: number, text: string) => {
      const margins = settings.quickMargins;
      const typed = typedNumber(text);
      if (typed !== margins[index])
        void save(
          'quickMargins',
          margins.map((margin, i) => (i === index ? typed : margin)),
        );
    },
  };
}

function useModel() {
  const shown = useShown();
  const { query, preview, panel, setPanel, said, asked, setAsked } = shown;
  // local: la opción sobre la que pasa el mouse es del dispositivo que tiene el mouse.
  const [looking, setLooking] = useState<{ key: SettingKey; value: number } | undefined>();
  const who = useStore(me);
  const online = useStore(onlineStore);
  const canChange = !!who && can(who, 'settings.change');
  const editable = canChange && online && !!query.data;
  const save = useSave(shown, editable);
  const seen = useLastSeen(who as object, query.data);
  const data = query.data ?? (query.failed ? seen?.data : undefined);
  // Los valores de lo que se ve, sin sus versiones.
  const values = data && valuesOf(data.settings);
  return {
    ...{ data, values },
    seenAtShown: formatTime(seen?.at as Date),
    ...{ fresh: !!query.data, failed: query.failed, retry: query.invalidate },
    ...{ prices: preview.data, panel, setPanel, said, asked, looking, setLooking },
    ...{ canChange, editable, online, save, clock: useClock(), holders: useHolders(canChange) },
    ...useChoose(setPanel),
    ...typing(save, values),
    // Un paso nuevo del redondeo: pregunta el servidor si cambian precios (R3.4).
    chooseStep: (step: number) => void save('roundingStep', step),
    cancel: () => setAsked(null),
    confirmStep: () =>
      void save('roundingStep', (asked as Confirm).step, (asked as Confirm).prices),
  };
}

// El modelo de Más → Administración (ADR-019); la confirmación del redondeo es otra pantalla encima.
export function useAdministration() {
  const model = useModel();
  useScreen('administration', model);
  useScreen('administration-confirm', model, !!model.asked);
  return model;
}

export type Administration = ReturnType<typeof useAdministration>;
