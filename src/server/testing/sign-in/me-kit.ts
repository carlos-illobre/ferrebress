// Lo que usan las pruebas de lo mío (04 · R6 a R9): personas sin permisos con su celular con huella,
// computadoras en otra red o en la del celular, entrar a una computadora con el código del celular y
// pedir lo mío.
import { createOfflineKit } from './offline-kit.ts';
import { openScreen } from './screen-channel.ts';
import { createDevice } from './sign-in-server.ts';

type Kit = Awaited<ReturnType<typeof createOfflineKit>>;
export type Linked = Awaited<ReturnType<Kit['linkedPhone']>>;
export type Device = ReturnType<typeof createDevice>;

// La computadora entra con el código que lee el celular (01 · R2.5).
async function enterWithCode(kit: Kit, linked: Linked, pc: Device) {
  const screen = await openScreen(kit.server, pc);
  const read = await linked.phone.request('/api/sign-in/codes/read', { code: screen.lastCode() });
  await linked.phone.request('/api/sign-in/codes/approve', {
    secret: read.body.secret,
    kind: 'assertion',
    response: linked.authenticator.get(read.body.authentication),
  });
  await screen.settle();
  const claimed = await screen.claim(screen.events.at(-1)?.permit as string);
  pc.cookie = (claimed.headers.get('Set-Cookie') as string).match(
    /__Host-session=[^;]+/,
  )?.[0] as string;
  await screen.close();
}

export async function createMeKit() {
  const kit = await createOfflineKit();
  let ip = 0;
  return {
    kit,
    computer: () => createDevice(kit.server, { ip: `200.1.1.${++ip}` }),
    // Una computadora en la red del celular, para entrar con su código (01 · R2.5).
    nextTo: (linked: Linked) => createDevice(kit.server, { ip: linked.phone.ip }),
    // Una persona sin ningún permiso con su celular con huella.
    async person() {
      const linked = await kit.linkedPhone();
      await kit.onlyWith(linked.userId, []);
      return linked;
    },
    enterWithCode: (linked: Linked, pc: Device) => enterWithCode(kit, linked, pc),
    mine: async (device: Device) => (await device.request('/api/me/devices')).body,
    audit: () => kit.server.platform.audit.read(2026),
  };
}

export type MeKit = Awaited<ReturnType<typeof createMeKit>>;
