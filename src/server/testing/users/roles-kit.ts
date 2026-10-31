// Para probar los roles desde la aplicación (02 · R7; diseño de 02, § 23): un servidor con el primer
// Administrador ya adentro, personas con los roles que se pidan, cada una con su dispositivo y su
// sesión, y un reloj que se adelanta para que Google deje de ser reciente (R3.8).
import { createDevice, createSignInServer } from '../sign-in/sign-in-server.ts';

export const minutes = (n: number) => n * 60_000;

type Device = ReturnType<typeof createDevice>;
type Person = { id: string; version: number };

export async function createRolesKit() {
  let now = new Date('2026-10-31T09:00:00Z').getTime();
  const clock = { now: () => new Date(now) };
  const server = await createSignInServer(clock);
  const admin = createDevice(server);
  const adminId = (await admin.signInWithGoogle({ sub: 'sub-admin', email: 'admin@example.com' }))
    .body.person.userId as string;
  let count = 0;

  const kit = {
    server,
    admin,
    adminId,
    // Que lo que se haga desde ahora venga con una confirmación vieja (más de 5 minutos).
    later: (ms = minutes(6)) => {
      now += ms;
    },
    // El Administrador vuelve a entrar con Google: su confirmación es reciente otra vez.
    reconfirm: () => admin.signInWithGoogle({ sub: 'sub-admin', email: 'admin@example.com' }),
    systemRole: async (): Promise<string> => (await admin.request('/api/users')).body.roles[0].id,
    // Un rol nuevo con esos permisos, creado por el Administrador.
    role: async (name: string, permissions: string[], by: Device = admin): Promise<string> =>
      (await by.request('/api/roles', { name, permissions })).body.role.id,
    // Cómo está una persona en la lista de Usuarios.
    row: async (id: string): Promise<Person & { roleIds: string[] }> =>
      (await admin.request('/api/users')).body.people.find((one: Person) => one.id === id),
    // Una persona autorizada con esos roles; con `signIn`, ya entró con Google en su dispositivo.
    async person(roles: string[], { signIn = true, name = undefined as string | undefined } = {}) {
      const email = `persona${++count}@example.com`;
      const authorized = await admin.request('/api/users', { email, roles, ...(name && { name }) });
      const id = authorized.body.person.id as string;
      const device = createDevice(server);
      if (signIn) await device.signInWithGoogle({ sub: `sub-${count}`, email });
      return { id, email, device };
    },
    // Los roles de una persona, con la versión que tiene ahora.
    async setRoles(id: string, roles: string[], by: Device = admin) {
      const { version } = await kit.row(id);
      return by.request(`/api/users/${id}/roles`, { version, roles });
    },
    audited: (type: string) =>
      server.platform.audit.read(2026).filter((event) => event.type === type),
  };
  return kit;
}

export type RolesKit = Awaited<ReturnType<typeof createRolesKit>>;
