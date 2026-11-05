// «Actualizar solo» en el servidor (05 · R4.6, E50 a E54; diseño de 05, § 7.1): el tema pide el
// permiso y lo suelta al sacarlo, el alta manda `{}`, lo escrito avisa como mucho cada 5 s, y la lista
// dice desde dónde contar las nuevas.
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { listen, settle } from '../../testing/device-link.ts';
import { createRolesKit, minutes, type RolesKit } from '../../testing/users/roles-kit.ts';
import { createNotifier } from './live.ts';

describe('el aviso de Quién hizo qué', () => {
  let kit: RolesKit;
  let viewer: Awaited<ReturnType<RolesKit['person']>>;
  let other: Awaited<ReturnType<RolesKit['person']>>;
  let view: string;

  beforeAll(async () => {
    kit = await createRolesKit();
    view = await kit.role('Mira el registro', ['audit-log.view']);
    viewer = await kit.person([view]);
    other = await kit.person([await kit.role('Solo personas', ['users.view'])]);
  });

  it('E54: al empezar a escuchar manda {}, y lo que se escribe avisa sin datos', async () => {
    const tab = await listen(kit.server, viewer.device, 'audit-log.new');
    expect(tab.status).toBe(200);
    expect(tab.received.filter((one) => one.event === 'audit-log.new')).toEqual([
      { event: 'audit-log.new', data: { subscribed: true } },
    ]);
    await kit.role('Uno más', ['users.view']);
    kit.server.platform.audit.flush();
    await settle();
    expect(tab.received.filter((one) => one.event === 'audit-log.new')).toHaveLength(2);
    expect(tab.last('audit-log.new')).toEqual({});
    await tab.close();
  });

  it('sin el permiso no se escucha y queda anotado, con el tema', async () => {
    const tab = await listen(kit.server, other.device, 'audit-log.new');
    expect(tab.status).toBe(403);
    expect(kit.audited('permission.denied').at(-1)).toMatchObject({
      actor: { kind: 'person', userId: other.id },
      data: { permission: 'audit-log.view', topic: 'audit-log.new' },
    });
    await tab.close();
  });

  it('seguridad, 29: sumarlo sin permiso también se anota, una vez por minuto y con la dirección', async () => {
    const tab = await listen(kit.server, other.device, 'device-link.code');
    const { channel } = tab.last('hello') as { channel: string };
    const denied = () =>
      kit
        .audited('permission.denied')
        .filter((one) => one.data?.topic === 'audit-log.new' && one.ipAddress);
    const before = denied().length;
    kit.later(minutes(2));
    for (let i = 0; i < 2; i++)
      await other.device.request('/api/realtime/subscriptions', {
        channel,
        add: ['audit-log.new'],
      });
    await settle();
    expect(tab.last('refused')).toEqual({ topic: 'audit-log.new', code: 'forbidden' });
    expect(denied().length).toBe(before + 1);
    await tab.close();
  });

  it('si le sacan el permiso mientras escucha, el canal lo suelta', async () => {
    const lucia = await kit.person([view]);
    const tab = await listen(kit.server, lucia.device, 'audit-log.new');
    kit.later();
    await kit.reconfirm();
    const without = await kit.role('Sin el registro', ['users.view']);
    const denied = () => kit.audited('permission.denied').length;
    const before = denied();
    expect((await kit.setRoles(lucia.id, [without])).status).toBe(200);
    await settle();
    // Volver a mirar los permisos no es un intento de la persona: no se anota.
    expect(denied()).toBe(before);
    expect(tab.last('refused')).toEqual({ topic: 'audit-log.new', code: 'forbidden' });
    expect(kit.server.platform.realtime.listeners('audit-log.new', 'all')).toBe(0);
    await tab.close();
  });
});

describe('como mucho un aviso cada 5 s', () => {
  afterEach(() => vi.useRealTimers());

  it('E52: el primero en el momento, los de los 5 s siguientes juntos al final', () => {
    vi.useFakeTimers();
    const publish = vi.fn();
    const notify = createNotifier(publish, () => true, 5000);
    notify();
    expect(publish).toHaveBeenCalledTimes(1);
    for (let i = 0; i < 9; i++) {
      vi.advanceTimersByTime(400);
      notify();
    }
    expect(publish).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(5000);
    expect(publish).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(60_000);
    expect(publish).toHaveBeenCalledTimes(2);
  });

  it('sin nadie que escuche, no avisa ni guarda temporizador', () => {
    vi.useFakeTimers();
    const publish = vi.fn();
    let listening = false;
    const notify = createNotifier(publish, () => listening, 5000);
    notify();
    expect(vi.getTimerCount()).toBe(0);
    listening = true;
    notify();
    notify();
    listening = false;
    vi.advanceTimersByTime(5000);
    expect(publish).toHaveBeenCalledTimes(1);
  });
});
