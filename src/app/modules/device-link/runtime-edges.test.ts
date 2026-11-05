// Los bordes del vínculo con dos dispositivos enteros (diseño de 03, § 8.3 y § 8.5): el celular que se
// fija solo, la huella `l=`, desconectar desde el otro por el servidor, el otro que se va sin avisar,
// lo que llega roto, terminar el vínculo, el Wi-Fi que se corta, sin internet y el directo dormido
// que vence.
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { platformSettings } from '../../platform/settings.ts';
import { pause, setupDevices as setup, stopDevices, together } from '../../testing/two-devices.ts';
import { deviceLinkSettings } from './settings.ts';

const isolated = async (run: () => Promise<void>) => {
  const before = platformSettings.direct.openWithinMs;
  platformSettings.direct.openWithinMs = 30;
  try {
    await run();
  } finally {
    platformSettings.direct.openWithinMs = before;
  }
};

afterEach(() => {
  stopDevices();
  localStorage.clear();
});

describe('los bordes del vínculo', () => {
  it('al vincular, si el celular se fija un instante antes, igual se encuentran', async () => {
    const { pc, phone } = setup();
    phone.start();
    await vi.waitFor(() => expect(phone.kind()).toBe('waiting'));
    pc.start();
    await vi.waitFor(() => {
      expect(pc.kind()).toBe('direct');
      expect(phone.kind()).toBe('direct');
    });
  });

  it('el celular solo se fija: sin la computadora deja el tema, y con `l=` cambiado se vuelve a fijar', async () => {
    const before = deviceLinkSettings.runtime.peekMs;
    deviceLinkSettings.runtime.peekMs = 20;
    onTestFinished(() => {
      deviceLinkSettings.runtime.peekMs = before;
    });
    const { pc, phone, server } = setup();
    phone.start();
    await vi.waitFor(() => expect(phone.kind()).toBe('waiting'));
    await vi.waitFor(() => expect(server.world.listening.size).toBe(0));
    pc.start();
    await vi.waitFor(() => expect(server.world.listening.has('computer')).toBe(true));
    phone.runtime.pairingChanged();
    await vi.waitFor(() => expect(phone.kind()).toBe('direct'));
    const checks = server.world.calls.filter((c) => c === 'phone:check').length;
    phone.runtime.pairingChanged();
    await vi.waitFor(() =>
      expect(server.world.calls.filter((c) => c === 'phone:check').length).toBe(checks + 1),
    );
  });

  it('por el servidor: desconectar del celular llega por el tema; el otro que se va sin avisar, también', () =>
    isolated(async () => {
      const { pc, phone, server, wifi } = setup();
      wifi.isolate(true);
      await together(pc, phone, 'relayed');
      phone.runtime.dispatch({ type: 'pause', from: 'here' });
      await vi.waitFor(() => expect(pc.kind()).toBe('paused'));
      expect(server.world.listening.has('computer')).toBe(true);
      // E29: en pausa la computadora a la vista sigue escuchando, y se entera en el momento.
      phone.runtime.dispatch({ type: 'resume', from: 'here' });
      await vi.waitFor(() => expect(pc.kind()).toBe('relayed'));
      await vi.waitFor(() => expect(phone.kind()).toBe('relayed'));
      phone.runtime.stop();
      await vi.waitFor(() => expect(pc.kind()).toBe('waiting'));
    }));

  it('lo que llega roto se anota y no cambia nada; un rechazo o una baja del tema hacen preguntar', () =>
    isolated(async () => {
      const { pc, phone, server, wifi } = setup();
      wifi.isolate(true);
      await together(pc, phone, 'relayed');
      server.push('computer', { nada: 1 });
      server.push('computer', { relay: [{ t: 'nada' }, 'texto'] });
      await vi.waitFor(() => expect(pc.notes()).toContain('unknown-message'));
      expect(pc.notes()).toContain('invalid');
      const checks = () => server.world.calls.filter((c) => c === 'computer:check').length;
      const before = checks();
      server.world.listening.get('computer')?.onRefused?.('not-paired');
      server.world.listening.get('computer')?.onDropped?.();
      await vi.waitFor(() => expect(checks()).toBe(before + 2));
      expect(pc.kind()).toBe('relayed');
    }));

  it('desvincular: el otro se entera por el adiós y pregunta (R2.3)', async () => {
    const { pc, phone, server } = setup();
    await together(pc, phone);
    server.world.paired = false;
    pc.runtime.dispatch({ type: 'serverSaid', pairing: null });
    await vi.waitFor(() => {
      expect(pc.kind()).toBe('unpaired');
      expect(phone.kind()).toBe('unpaired');
    });
  });

  it('desconectar sin vínculo en el servidor lo descubre; sin internet queda desconectado acá', async () => {
    const { pc, phone, server } = setup();
    await together(pc, phone);
    server.world.online.set('computer', false);
    pc.runtime.dispatch({ type: 'pause', from: 'here' });
    await vi.waitFor(() => expect(pc.notes()).toContain('post-failed'));
    expect(pc.kind()).toBe('paused');
    server.world.online.set('computer', true);
    await vi.waitFor(() => expect(phone.kind()).toBe('paused'));
    server.world.paired = false;
    phone.runtime.dispatch({ type: 'resume', from: 'here' });
    await vi.waitFor(() => expect(phone.kind()).toBe('unpaired'));
  });

  it('el Wi-Fi se corta: los dos se confirman y se vuelven a presentar', async () => {
    const { pc, phone, server, wifi } = setup();
    await together(pc, phone);
    const attempts = server.world.attempts;
    wifi.cut();
    await vi.waitFor(() => expect(server.world.attempts).toBe(attempts + 1));
    await vi.waitFor(() => {
      expect(pc.kind()).toBe('direct');
      expect(phone.kind()).toBe('direct');
    });
  });

  it('sin internet por el servidor espera, reintenta y al volver se presentan de nuevo (E21)', () =>
    isolated(async () => {
      const delays = platformSettings.reconnect.delaysMs.splice(
        0,
        platformSettings.reconnect.delaysMs.length,
        10,
        10,
        10,
        10,
        10,
      );
      try {
        const { pc, phone, server, wifi } = setup();
        wifi.isolate(true);
        await together(pc, phone, 'relayed');
        server.world.online.set('computer', false);
        pc.online.set(false);
        await vi.waitFor(() => expect(pc.kind()).toBe('offline'));
        await pause(15);
        expect(pc.kind()).toBe('offline');
        server.world.online.set('computer', true);
        await vi.waitFor(() => expect(pc.kind()).toBe('relayed'));
      } finally {
        platformSettings.reconnect.delaysMs.splice(
          0,
          platformSettings.reconnect.delaysMs.length,
          ...delays,
        );
      }
    }));

  it('lo que llega mientras ya no espeja se anota y no entra', async () => {
    const { pc, phone } = setup();
    await together(pc, phone);
    pc.runtime.dispatch({ type: 'pause', from: 'here' });
    phone.value.set('a destiempo');
    await vi.waitFor(() => expect(pc.notes()).toContain('ignored'));
    expect(pc.value.get()).not.toBe('a destiempo');
  });

  it('el directo dormido vence: cada uno sigue esperando y al volver se presentan de nuevo', async () => {
    const before = deviceLinkSettings.runtime.dormantMs;
    deviceLinkSettings.runtime.dormantMs = 20;
    try {
      const { pc, phone } = setup();
      await together(pc, phone);
      phone.runtime.dispatch({ type: 'tabAway', why: 'hidden' });
      await vi.waitFor(() => expect(pc.notes()).toContain('dormantLost'));
      expect(pc.journal.entries().some((e) => e.e === 'peerGone' && e.w === 'hidden')).toBe(true);
      expect(phone.runtime.state.get()).toEqual({ kind: 'away', pairing: expect.anything() });
      phone.runtime.dispatch({ type: 'tabBack' });
      await vi.waitFor(() => expect(phone.kind()).toBe('direct'));
    } finally {
      deviceLinkSettings.runtime.dormantMs = before;
    }
  });
});
