// Dos dispositivos enteros, cada uno con su vínculo, su espejo y su diario, contra un servidor y un
// Wi-Fi de mentira (diseño de 03, § 20): presentarse y espejar por el directo, el respaldo cuando el
// Wi-Fi aísla los equipos y probar el directo, el directo dormido al ocultarse, desconectar y
// reconectar, versiones distintas, la confirmación que corta a un otro fuera de regla, y terminar.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { platformSettings } from '../../platform/settings.ts';
import {
  device,
  pause,
  setupDevices as setup,
  stopDevices,
  together,
} from '../../testing/two-devices.ts';

afterEach(() => {
  stopDevices();
  localStorage.clear();
});

describe('dos dispositivos vinculados', () => {
  it('se presentan por el directo, la foto de la computadora gana y cada cambio se ve en el otro', async () => {
    const { pc, phone, server } = setup();
    phone.value.set('viejo del celular');
    pc.value.set('de la compu');
    await together(pc, phone);
    await vi.waitFor(() => expect(phone.value.get()).toBe('de la compu'));
    phone.value.set('desde el celular');
    await vi.waitFor(() => expect(pc.value.get()).toBe('desde el celular'));
    pc.value.set('desde la compu');
    await vi.waitFor(() => expect(phone.value.get()).toBe('desde la compu'));
    // Por el directo los dos dejan el tema; cada uno confirmó con el servidor.
    expect(server.world.listening.size).toBe(0);
    expect(server.world.calls).toContain('computer:check');
    expect(server.world.calls).toContain('phone:check');
    expect(await pc.runtime.roundTripMs()).toBe(8);
    const diary = JSON.stringify(pc.journal.entries());
    expect(diary).not.toContain(server.world.id);
    expect(diary).not.toContain('Celular');
  });

  it('E09: con el Wi-Fi que aísla, van por el servidor; probar el directo, con el Wi-Fi bien, cambia sin cortar', async () => {
    const before = platformSettings.direct.openWithinMs;
    platformSettings.direct.openWithinMs = 30;
    try {
      const { pc, phone, server, wifi } = setup();
      wifi.isolate(true);
      await together(pc, phone, 'relayed');
      expect(server.world.calls).toContain('computer:report');
      pc.value.set('por el servidor');
      await vi.waitFor(() => expect(phone.value.get()).toBe('por el servidor'));
      phone.runtime.dispatch({ type: 'probe' });
      await vi.waitFor(() => expect(pc.runtime.state.get()).toMatchObject({ probe: 'failed' }));
      wifi.isolate(false);
      pc.runtime.dispatch({ type: 'probe' });
      await vi.waitFor(() => {
        expect(pc.kind()).toBe('direct');
        expect(phone.kind()).toBe('direct');
      });
      phone.value.set('ya directo');
      await vi.waitFor(() => expect(pc.value.get()).toBe('ya directo'));
    } finally {
      platformSettings.direct.openWithinMs = before;
    }
  });

  it('E22, E22b: el celular se oculta: el directo queda dormido y al volver saluda por él, sin presentarse de nuevo', async () => {
    const { pc, phone, server } = setup();
    await together(pc, phone);
    const attempts = server.world.attempts;
    phone.runtime.dispatch({ type: 'tabAway', why: 'hidden' });
    await vi.waitFor(() =>
      expect(pc.runtime.state.get()).toMatchObject({ kind: 'waiting', dormant: '00000001' }),
    );
    expect(phone.kind()).toBe('away');
    phone.runtime.dispatch({ type: 'tabBack' });
    await vi.waitFor(() => {
      expect(pc.kind()).toBe('direct');
      expect(phone.kind()).toBe('direct');
    });
    expect(server.world.attempts).toBe(attempts);
    pc.value.set('de vuelta');
    await vi.waitFor(() => expect(phone.value.get()).toBe('de vuelta'));
  });

  it('desconectar conserva el directo sin espejar; reconectar vuelve sin presentarse (E27, E29)', async () => {
    const { pc, phone, server } = setup();
    await together(pc, phone);
    pc.runtime.dispatch({ type: 'pause', from: 'here' });
    await vi.waitFor(() => expect(phone.kind()).toBe('paused'));
    expect(server.world.paused).toBe(true);
    pc.value.set('solo en la compu');
    await pause(20);
    expect(phone.value.get()).not.toBe('solo en la compu');
    phone.runtime.dispatch({ type: 'resume', from: 'here' });
    await vi.waitFor(() => {
      expect(pc.kind()).toBe('direct');
      expect(phone.kind()).toBe('direct');
    });
    expect(server.world.paused).toBe(false);
    await vi.waitFor(() => expect(phone.value.get()).toBe('solo en la compu'));
  });

  it('E43: con versiones distintas no espejan, y quedan esperando (R6.7)', async () => {
    const { pc, phone, server, wifi, add } = setup(['v2', 'v1']);
    pc.start();
    await vi.waitFor(() => expect(pc.kind()).toBe('waiting'));
    phone.start();
    await vi.waitFor(() => {
      expect(pc.runtime.state.get()).toMatchObject({ kind: 'waiting', why: 'version' });
      expect(phone.runtime.state.get()).toMatchObject({ kind: 'waiting', why: 'version' });
    });
    // La computadora, al día, vuelve a esperar; el celular viejo no: no se presentan una y otra vez.
    await vi.waitFor(() => expect([...server.world.listening.keys()]).toEqual(['computer']));
    const attempts = server.world.attempts;
    phone.runtime.pairingChanged();
    await pause(50);
    expect(server.world.attempts).toBe(attempts);
    // Actualizado, se presentan y espejan.
    phone.runtime.stop();
    const updated = device('phone', server, wifi, 'v2');
    add(updated);
    updated.start();
    await vi.waitFor(() => expect(updated.kind()).toBe('direct'));
  });

  it('E39b: si la sesión del otro se cerró, lo que manda no entra pasados los 4 minutos (§ 7)', async () => {
    const { pc, phone, server } = setup();
    await together(pc, phone);
    server.world.open.set('phone', false);
    const now = performance.now();
    const clock = vi.spyOn(performance, 'now').mockReturnValue(now + 5 * 60_000);
    phone.value.set('de un celular cortado');
    await vi.waitFor(() => expect(pc.kind()).toBe('waiting'));
    clock.mockRestore();
    expect(pc.value.get()).not.toBe('de un celular cortado');
  });

  it('E11: salir avisa al otro antes que nada; desvincular deja a los dos sin vincular', async () => {
    const { pc, phone, server } = setup();
    await together(pc, phone);
    phone.runtime.sessionLost(false);
    // El espejo se desconecta en el acto, antes que la fila (§ 16).
    expect(phone.mirror.port()).toBeUndefined();
    await vi.waitFor(() => expect(pc.kind()).toBe('waiting'));
    expect(phone.kind()).toBe('asleep');
    expect(phone.value.get()).toBe('inicial');
    server.world.paired = false;
    pc.runtime.dispatch({ type: 'serverSaid', pairing: null });
    await vi.waitFor(() => expect(pc.kind()).toBe('unpaired'));
  });

  it('sin internet, el directo sigue; al volver, por el servidor se vuelve a esperar', async () => {
    const { pc, phone } = setup();
    await together(pc, phone);
    pc.online.set(false);
    await pc.runtime.settled();
    expect(pc.kind()).toBe('direct');
    pc.online.set(true);
    await pc.runtime.settled();
    expect(pc.kind()).toBe('direct');
  });
});
