// Lo mío, desde la seguridad y el costo (diseño de 04b, § 8 y § 9): ninguna respuesta lleva el
// identificador de un dispositivo, y cada ruta hace las consultas que tiene que hacer.
import { beforeAll, describe, expect, it } from 'vitest';
import { createMeKit, type MeKit } from '../../../testing/sign-in/me-kit.ts';

describe('lo mío: lo que sale y lo que cuesta', () => {
  let me: MeKit;
  beforeAll(async () => {
    me = await createMeKit();
  });

  it('device-settings § 8: ninguna respuesta de lo que toca dispositivos lleva su identificador', async () => {
    // Una persona con todos los permisos: ve también Usuarios, «Se perdió» y Quién hizo qué.
    const linked = await me.kit.linkedPhone();
    const pc = me.nextTo(linked);
    await me.enterWithCode(linked, pc);
    await pc.request('/api/me/device-name', { name: 'Caja' });
    const paths = [
      '/api/me/devices',
      `/api/users/${linked.userId}/access`,
      '/api/lost-phones',
      '/api/start',
      '/api/device-link/check',
      '/api/audit-log',
    ];
    for (const device of [linked.phone, pc])
      for (const path of paths) {
        const reply = await device.request(path);
        expect(reply.status, path).toBe(200);
        const body = JSON.stringify(reply.body);
        for (const id of [linked.phone.id, pc.id]) expect(body, path).not.toContain(id);
      }
  });

  it('device-settings § 9: las consultas de cada ruta de lo mío', async () => {
    const linked = await me.person();
    const [a, b, c] = [me.computer(), me.computer(), me.computer()];
    for (const pc of [a, b, c]) await pc.signInWithGoogle(linked.claims);
    const { others } = await me.mine(linked.phone);
    const count = (path: string, body: unknown = {}) =>
      me.kit.server.countQueries(() => linked.phone.request(path, body));
    // Lo mío: las sesiones y las huellas, a la vez.
    expect(await me.kit.server.countQueries(() => me.mine(linked.phone))).toBe(2);
    // Cerrar una: buscarla y, en su transacción con el aviso, cerrarla y lo del vínculo.
    expect(await count(`/api/me/sessions/${others[0].session.id}/close`)).toBe(5);
    // Cerrar todas: en su transacción, cerrarlas y lo del vínculo.
    expect(await count('/api/me/sessions/close')).toBe(4);
    // Quitar la huella del celular en la mano: una.
    expect(await count('/api/me/passkey/remove')).toBe(1);
  });
});
