// Traer las personas y los roles de Usuarios (02 · R3.1): al abrir y, sin conexión, cuando vuelve (con
// la lista que ya tenía no se pide de nuevo). Una entrada sin conexión que el servidor todavía no
// confirmó: su sesión todavía no existe allá y un pedido la daría por cerrada (15 · R3); se espera a
// que la confirme. Devuelve si hay conexión.
import { useEffect } from 'preact/hooks';
import { online as onlineStore } from '../../platform/server/api.ts';
import { useStore } from '../../platform/store.ts';
import { pendingEntries } from '../sign-in/index.ts';

type Loads = {
  list: { people: unknown; load: () => Promise<unknown> };
  roleRows: { roleRows: unknown; loadRoles: () => Promise<unknown> };
};

export function useLoad({ list, roleRows }: Loads, roles: boolean) {
  const online = useStore(onlineStore);
  const unconfirmed = useStore(pendingEntries) > 0;
  useEffect(() => {
    if (online && !unconfirmed && !list.people) void list.load();
    if (online && !unconfirmed && !roleRows.roleRows) void roleRows.loadRoles();
  }, [online, unconfirmed, roles]);
  return online;
}
