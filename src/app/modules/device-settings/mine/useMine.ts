// Lo mío en Configuración, sin HTML (04 · R6 a R10; diseño de 04b, § 6): lo pide al abrirse y después
// de cada cambio, nunca solo (R10.1); sin conexión queda lo último que se vio, gris, con «Reintentar».
// Cerrar y cortar usan la lógica común de sign-in; acá se arma el recibo y se pone al día la pantalla.
import type { MyDevice, MyDevicesResponse } from '@ferrebress/shared/contracts/device-settings';
import { useEffect, useState } from 'preact/hooks';
import { online as onlineStore } from '../../../platform/server/api.ts';
import { useStore } from '../../../platform/store.ts';
import { showToast } from '../../../ui/toast/Toast.tsx';
import {
  accessApi,
  closeAllSessions,
  closeSession,
  cutPhone,
  linkHere,
  type Refused,
  removeHere,
} from '../../sign-in/index.ts';
import { type Receipt, receiptOf } from './rules.ts';
import { mineTexts as t } from './texts.ts';

// Sin conexión, con lo último que se vio, si se vio algo.
export type MineState =
  | { status: 'loading' | 'failed' }
  | { status: 'ready'; data: MyDevicesResponse }
  | { status: 'offline'; data?: MyDevicesResponse };

export function useMine() {
  // local: lo mío es de cada dispositivo, no se espeja (R1.6).
  const [loaded, setState] = useState<MineState>({ status: 'loading' });
  // Si se corta la conexión con la pantalla abierta, lo mío queda gris al momento (R10.1).
  const online = useStore(onlineStore);
  const state: MineState =
    !online && loaded.status === 'ready' ? { status: 'offline', data: loaded.data } : loaded;
  // local: el recibo es de quien cortó, en su dispositivo.
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const goneOffline = () =>
    setState((now) => ({
      status: 'offline',
      ...('data' in now && now.data && { data: now.data }),
    }));
  const load = async () => {
    const result = await accessApi.mine();
    if (result.ok) setState({ status: 'ready', data: result.data });
    else if (result.error === 'offline') goneOffline();
    else setState({ status: 'failed' });
  };
  useEffect(() => void load(), []);
  // Un rechazo: sin conexión, gris; si no, se dice y se vuelve a pedir lo de ahora.
  const refuse = (result: Refused) => {
    if (result.error === 'offline') return goneOffline();
    showToast(t.refused, 'triangle-alert');
    void load();
  };
  return {
    state,
    receipts,
    reload: load,
    dismiss: (key: string) => setReceipts((all) => all.filter((one) => one.key !== key)),
    ...actions(load, refuse, setReceipts),
  };
}

type SetReceipts = (change: (all: Receipt[]) => Receipt[]) => void;

// Lo que se hace desde lo mío; después de cada cosa, se vuelve a pedir lo de ahora.
function actions(
  load: () => Promise<void>,
  refuse: (result: Refused) => void,
  setReceipts: SetReceipts,
) {
  const then = { refuse, update: load };
  return {
    closeSession: (id: string, device: string) => closeSession('me', { id, device }, then),
    closeAll: () => closeAllSessions('me', then),
    // «Se me perdió» o «Quitar» en otro celular: queda un recibo con lo cortado.
    async cut(device: MyDevice, how: 'remove' | 'lost') {
      const receipt = receiptOf(device, how);
      const done = await cutPhone('me', { key: device.key, how }, then);
      if (!done) return;
      // Si ya no tenía nada (lo cortaron desde otro lado), el recibo lo dice.
      const cut = done.sessions || done.passkey ? receipt : { ...receipt, cuts: [] };
      setReceipts((all) => [cut, ...all.filter((one) => one.key !== device.key)]);
    },
    removeHere: () => removeHere(then),
    async rename(name: string) {
      const result = await accessApi.rename(name);
      if (!result.ok) return refuse(result);
      showToast(result.data.name ? t.name.saved(result.data.name) : t.name.cleared, 'pencil-line');
      await load();
      return result.data;
    },
    // Después de volver a confirmar quién es (02 · R3.8).
    async link() {
      const linked = await linkHere();
      if (linked === 'linked') showToast(t.passkey.linked, 'fingerprint');
      if (linked === 'other-account') showToast(t.passkey.otherAccount, 'triangle-alert');
      await load();
    },
  };
}

export type Mine = ReturnType<typeof useMine>;
