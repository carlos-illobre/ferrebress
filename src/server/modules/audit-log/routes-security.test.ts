import { beforeAll, describe, expect, it } from 'vitest';
import { createRolesKit, minutes, type RolesKit } from '../../testing/users/roles-kit.ts';

describe('Quién hizo qué, desde el servidor: lo que intenta un atacante', () => {
  let kit: RolesKit;
  let viewer: Awaited<ReturnType<RolesKit['person']>>;
  let other: Awaited<ReturnType<RolesKit['person']>>;

  beforeAll(async () => {
    kit = await createRolesKit();
    const view = await kit.role('Mira el registro', ['audit-log.view']);
    viewer = await kit.person([view]);
    other = await kit.person([await kit.role('Solo personas', ['users.view'])]);
  });

  const list = (query = '', by = kit.admin) => by.request(`/api/audit-log${query}`);

  it('seguridad: no sale lo que el tipo no muestra, ni el identificador de ningún dispositivo', async () => {
    const stranger = await kit.admin.request('/api/audit-log?type=sign-in.succeeded');
    expect(stranger.body.events[0].data).toEqual({ method: 'google' });
    const devices = [kit.admin.id, viewer.device.id, other.device.id];
    const { pages } = (await list('?size=20')).body;
    const answers = [
      await kit.admin.request('/api/audit-log/people'),
      await kit.admin.request('/api/audit-log/day?date=2026-10-31'),
    ];
    for (let page = 1; page <= pages; page++) answers.push(await list(`?size=20&page=${page}`));
    const everything = JSON.stringify(answers.map((answer) => answer.body));
    for (const id of devices) expect(everything).not.toContain(id);
  });

  it('audit-log-R1.3: abrir la cinta o las personas también deja el rastro, una vez por sesión y día', async () => {
    const watcher = await kit.person([await kit.role('Mira el día', ['audit-log.view'])]);
    const opened = () =>
      kit
        .audited('audit-log.opened')
        .filter((one) => one.actor.kind === 'person' && one.actor.userId === watcher.id);
    await watcher.device.request('/api/audit-log/day');
    await watcher.device.request('/api/audit-log/people');
    expect(opened()).toHaveLength(1);
  });

  it('seguridad: como mucho 60 pedidos por minuto por persona', async () => {
    let last = 0;
    for (let i = 0; i < 61; i++) last = (await list('', viewer.device)).status;
    expect(last).toBe(429);
    expect(kit.audited('request.throttled').at(-1)?.data).toEqual({
      topic: 'audit-log',
      by: 'person',
    });
  });
});
