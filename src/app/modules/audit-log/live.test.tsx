// «Actualizar solo» en la pantalla (05 · R4.6, R4.12, E34, E49 a E56; diseño de 05, § 7.2), con el
// servidor y el canal de mentira: el selector, la puesta al día arriba de todo con la marca, «3
// nuevas» más abajo, como mucho una vez cada 5 s, sin hoy no hay selector, y no viaja por el espejo.
import { act, fireEvent, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startKeyboard } from '../../platform/keyboard.ts';
import { meter } from '../../platform/meter.ts';
import { mirror } from '../../platform/mirror/registry.ts';
import { detail, events, first, firstPhone, openAuditLog, page } from './audit-test-kit.tsx';
import { auditLogSettings } from './settings.ts';

const settle = (ms = 30) => act(() => new Promise((resolve) => setTimeout(resolve, ms)));
const toggle = () => screen.getByRole('switch', { name: 'Actualizar solo' });
const fresh = { ...(events[0] as (typeof events)[number]), id: '2026:6', type: 'sign-out' };
const newer = page({
  latest: '2025:0.2026:6',
  events: [fresh, ...events],
  total: 26,
  summary: { total: 5, amber: 2, red: 1 },
  strip: [
    { id: '2026:2', at: 9 * 3600 + 40 * 60, tone: 'amber' },
    { id: '2026:5', at: 11 * 3600 + 52 * 60, tone: 'red' },
    { id: '2026:6', at: 12 * 3600, tone: 'plain' },
  ],
});
const second = '/api/audit-log?page=2&size=20';
const live = auditLogSettings.live;
// La pantalla ya escucha el tema (se pide después de dibujar).
const listening = (server: { listening: () => string[] }) =>
  waitFor(() => expect(server.listening()).toEqual(['audit-log.new']));
const saved = { ...live };

describe('Actualizar solo', () => {
  beforeEach(() => Object.assign(live, { everyMs: 60, releaseMs: 20, markMs: 40 }));
  afterEach(() => {
    Object.assign(live, saved);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('E49: prendido al abrir en la computadora, apagado en el celular, y no está «Actualizar»', async () => {
    const pc = openAuditLog();
    await screen.findByText('25 acciones');
    expect(toggle().getAttribute('aria-checked')).toBe('true');
    expect(toggle().title).toBe('Actualizar solo');
    expect(screen.queryByRole('button', { name: /^Actualizar$/ })).toBeNull();
    await listening(pc);
  });

  it('E34: apagado, un aviso no cambia la lista ni pide nada', async () => {
    const phone = openAuditLog({}, true);
    await screen.findByText('25 acciones');
    expect(toggle().getAttribute('aria-checked')).toBe('false');
    expect(phone.listening()).toEqual([]);
    const before = phone.sent.length;
    phone.notice();
    await settle();
    expect(phone.sent.length).toBe(before);
  });

  it('E50: arriba de todo entra lo nuevo marcado, con el resumen y la tira, y la acción elegida queda', async () => {
    const pc = openAuditLog({ [first]: [{ body: page() }, { body: newer }] });
    await screen.findByText('25 acciones');
    await listening(pc);
    pc.notice();
    await screen.findByText('26 acciones');
    const marked = document.querySelector('.audit-row[data-new]') as HTMLElement;
    expect(marked.dataset.id).toBe('2026:6');
    expect(document.querySelectorAll('.audit-row[data-new]')).toHaveLength(1);
    expect(
      document.querySelector('.audit-row[aria-selected="true"]')?.getAttribute('data-id'),
    ).toBe('2026:5');
    // El resumen y la tira, también al día, con la raya nueva marcada.
    expect(document.querySelector('.audit-number')?.textContent).toContain('5');
    expect(document.querySelector('.audit-tick[data-new]')).toBeTruthy();
    await settle(80);
    expect(document.querySelector('.audit-row[data-new]')).toBeNull();
  });

  it('la acción elegida sigue en el detalle aunque al ponerse al día haya pasado a la página 2', async () => {
    const last = events.at(-1) as (typeof events)[number];
    const shifted = page({ latest: '2025:0.2026:6', events: [fresh, ...events.slice(0, -1)] });
    const pc = openAuditLog({ [first]: [{ body: page() }, { body: shifted }] });
    await screen.findByText('25 acciones');
    await listening(pc);
    fireEvent.click(document.querySelector(`.audit-row[data-id="${last.id}"]`) as HTMLElement);
    const before = detail();
    expect(before).not.toBe('');
    pc.notice();
    await waitFor(() => expect(document.querySelector('.audit-row[data-new]')).toBeTruthy());
    expect(document.querySelector(`.audit-row[data-id="${last.id}"]`)).toBeNull();
    expect(detail()).toBe(before);
  });

  it('E51: en la página 2 no se mueve nada y aparece «3 nuevas»; tocarlo va a la página 1', async () => {
    const pc = openAuditLog({
      [second]: { body: page({ page: 2 }) },
      '/api/audit-log/new?since=2025%3A0.2026%3A5': { body: { count: 3 } },
      [first]: [{ body: page() }, { body: newer }],
    });
    await screen.findByText('25 acciones');
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await waitFor(() => expect(pc.sent.at(-1)?.path).toBe(second));
    await listening(pc);
    pc.notice();
    const button = await screen.findByRole('button', { name: /3 nuevas/ });
    fireEvent.click(button);
    await screen.findByText('26 acciones');
    expect(pc.sent.at(-1)?.path).toBe(first);
    expect(document.querySelector('.audit-row[data-new]')?.getAttribute('data-id')).toBe('2026:6');
    expect(screen.queryByRole('button', { name: /nuevas/ })).toBeNull();
  });

  it('E52: muchos avisos seguidos ponen la lista al día como mucho una vez por espera', async () => {
    const pc = openAuditLog();
    await screen.findByText('25 acciones');
    await listening(pc);
    const lists = () => pc.sent.filter((one) => one.path === first).length;
    const before = lists();
    for (let i = 0; i < 10; i++) pc.notice();
    await settle(20);
    expect(lists()).toBe(before + 1);
    await settle(80);
    expect(lists()).toBe(before + 2);
  });

  it('E53: con otro día que no es hoy, no hay selector ni tema', async () => {
    const pc = openAuditLog({ [first]: { body: page({ withToday: false }) } });
    await screen.findByText('25 acciones');
    expect(screen.queryByRole('switch')).toBeNull();
    await settle(40);
    expect(pc.listening()).toEqual([]);
  });

  it('E54: con la pestaña oculta, lo que esperaba para pedir no sale', async () => {
    const pc = openAuditLog();
    await screen.findByText('25 acciones');
    await listening(pc);
    pc.notice();
    await settle(10);
    const lists = () => pc.sent.filter((one) => one.path === first).length;
    const before = lists();
    pc.notice();
    const hidden = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    act(() => void document.dispatchEvent(new Event('visibilitychange')));
    await settle(100);
    expect(lists()).toBe(before);
    hidden.mockRestore();
  });

  it('E55: en el celular, prenderlo pide la lista y muestra lo que gasta esta pantalla', async () => {
    meter.count(2355, ['audit-log.new']);
    const phone = openAuditLog({}, true);
    await screen.findByText('25 acciones');
    // Apagado dice 0, aunque el canal haya mandado algo en el último minuto.
    expect(screen.getByText('0 KB/min')).toBeTruthy();
    fireEvent.click(toggle());
    await listening(phone);
    const before = phone.sent.filter((one) => one.path === firstPhone).length;
    phone.notice();
    await waitFor(() =>
      expect(phone.sent.filter((one) => one.path === firstPhone).length).toBe(before + 1),
    );
    expect(screen.getByText('2,3 KB/min')).toBeTruthy();
    // Apagado dice 0 en el momento (R4.12).
    fireEvent.click(toggle());
    expect(screen.getByText('0 KB/min')).toBeTruthy();
  });

  it('E56: el selector no viaja por el espejo', async () => {
    const send = vi.fn();
    mirror.attach({ send, leader: true, over: 'direct' });
    openAuditLog();
    await screen.findByText('25 acciones');
    send.mockClear();
    fireEvent.click(toggle());
    fireEvent.click(toggle());
    await settle();
    expect(send).not.toHaveBeenCalled();
    mirror.detach();
  });

  it('Alt + R apaga y prende el selector, y Alt + N toca «1 nueva»', async () => {
    const stop = startKeyboard();
    const alt = (key: string) =>
      act(() => {
        dispatchEvent(
          new KeyboardEvent('keydown', { key, code: `Key${key.toUpperCase()}`, altKey: true }),
        );
      });
    const pc = openAuditLog({
      ['/api/audit-log?page=2&size=20']: { body: page({ page: 2 }) },
      ['/api/audit-log/new?since=2025%3A0.2026%3A5']: { body: { count: 1 } },
    });
    await screen.findByText('25 acciones');
    alt('r');
    expect(toggle().getAttribute('aria-checked')).toBe('false');
    alt('r');
    expect(toggle().getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await listening(pc);
    await settle(70);
    pc.notice();
    await screen.findByRole('button', { name: /1 nueva/ });
    alt('n');
    await waitFor(() => expect(pc.sent.at(-1)?.path).toBe(first));
    stop();
  });
});
