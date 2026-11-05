// Los bordes de «Actualizar solo» (diseño de 05, § 7.2): un aviso con la cinta abierta se atiende al
// cerrarla; una respuesta vieja (otro filtro, la lista bajada) no se usa; con 429 espera; sin el
// permiso pide para enterarse; prender y apagar seguido no rehace el canal.
import { act, fireEvent, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mirror } from '../../platform/mirror/registry.ts';
import { held } from '../../testing/fake-server.ts';
import { first, openAuditLog, page } from './audit-test-kit.tsx';
import { auditLogSettings } from './settings.ts';

const settle = (ms = 30) => act(() => new Promise((resolve) => setTimeout(resolve, ms)));
const listening = (server: { listening: () => string[] }) =>
  waitFor(() => expect(server.listening()).toEqual(['audit-log.new']));
const toggle = () => screen.getByRole('switch', { name: 'Actualizar solo' });
const newOnes = '/api/audit-log/new?since=2025%3A0.2026%3A5';
const later = page({ total: 30 });
const live = auditLogSettings.live;
const saved = { ...live };
let clock = 900;
const receive = (key: string, value: unknown) =>
  act(() => mirror.receive([{ k: key, v: value as never, c: ++clock, l: true }]));

describe('los bordes de Actualizar solo', () => {
  beforeEach(() => Object.assign(live, { everyMs: 60, releaseMs: 40, markMs: 40 }));
  afterEach(() => {
    Object.assign(live, saved);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const lists = (server: { sent: { path: string }[] }, path = first) =>
    server.sent.filter((one) => one.path === path).length;

  it('con la cinta abierta no pide nada; al cerrarla se pone al día', async () => {
    const pc = openAuditLog({ [first]: [{ body: page() }, { body: later }] });
    await screen.findByText('25 acciones');
    await listening(pc);
    receive('audit-log.tape', { date: '2026-10-28', at: null });
    pc.notice();
    await settle();
    expect(lists(pc)).toBe(1);
    receive('audit-log.tape', null);
    await screen.findByText('30 acciones');
  });

  it('si mientras pedía la persona bajó en la lista, no la mueve: cuenta las nuevas', async () => {
    const answer = held({ body: later });
    const pc = openAuditLog({
      [first]: [{ body: page() }, answer.reply],
      [newOnes]: { body: { count: 150 } },
    });
    await screen.findByText('25 acciones');
    await listening(pc);
    pc.notice();
    await settle(5);
    const ledger = document.querySelector('.audit-ledger') as HTMLElement;
    ledger.scrollTop = 200;
    answer.release();
    await screen.findByRole('button', { name: /Más de 99 nuevas/ });
    expect(screen.getByText('25 acciones')).toBeTruthy();
  });

  it('si mientras pedía cambió el filtro, la respuesta vieja no se usa', async () => {
    const answer = held({ body: later });
    const yesterday = '/api/audit-log?page=1&size=20&range=yesterday&summary=1&strip=1';
    const pc = openAuditLog({
      [first]: [{ body: page() }, answer.reply],
      [yesterday]: { body: page({ total: 7, withToday: false }) },
      [newOnes]: [answer.reply],
    });
    await screen.findByText('25 acciones');
    await listening(pc);
    pc.notice();
    await settle(5);
    const filters = { dates: { range: 'yesterday' } };
    receive('audit-log.list.asked', JSON.stringify({ filters, page: 1, dates: true, round: 5 }));
    await screen.findByText('7 acciones');
    answer.release();
    await settle();
    expect(screen.getByText('7 acciones')).toBeTruthy();
  });

  it('una cuenta vieja tampoco se usa, y con 429 no pide nada solo hasta que pase lo que dice', async () => {
    const answer = held({ body: { count: 4 } });
    const second = '/api/audit-log?page=2&size=20';
    const third = '/api/audit-log?page=3&size=20';
    const pc = openAuditLog({
      [second]: { body: page({ page: 2 }) },
      [third]: { body: page({ page: 3 }) },
      [newOnes]: [
        answer.reply,
        { status: 429, body: { error: 'too-many-attempts', retryAfterSeconds: 1 } },
      ],
    });
    await screen.findByText('25 acciones');
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await screen.findByText('página 2 de 2');
    await listening(pc);
    await settle(70);
    pc.notice();
    await waitFor(() => expect(lists(pc, newOnes)).toBe(1));
    receive(
      'audit-log.list.asked',
      JSON.stringify({ filters: {}, page: 3, dates: false, round: 9 }),
    );
    await waitFor(() => expect(lists(pc, third)).toBe(1));
    answer.release();
    await settle();
    expect(screen.queryByRole('button', { name: /nuevas/ })).toBeNull();
    await settle(70);
    pc.notice();
    await settle();
    expect(lists(pc, newOnes)).toBe(2);
    await settle(70);
    pc.notice();
    await settle();
    expect(lists(pc, newOnes)).toBe(2);
  });

  it('si poner la lista al día falla, queda como estaba y el próximo aviso vuelve a probar', async () => {
    const broken = { status: 500, body: { error: 'unexpected' } };
    const pc = openAuditLog({ [first]: [{ body: page() }, broken, { body: later }] });
    await screen.findByText('25 acciones');
    await listening(pc);
    pc.notice();
    await settle(70);
    expect(screen.getByText('25 acciones')).toBeTruthy();
    pc.notice();
    await screen.findByText('30 acciones');
  });

  it('con 429 al poner la lista al día, también espera', async () => {
    const tooMany = { status: 429, body: { error: 'too-many-attempts' } };
    const pc = openAuditLog({ [first]: [{ body: page() }, tooMany] });
    await screen.findByText('25 acciones');
    await listening(pc);
    pc.notice();
    await settle(70);
    pc.notice();
    await settle();
    expect(lists(pc)).toBe(2);
  });

  it('si le sacan el permiso, pide algo que solo pide la sesión para enterarse; otro rechazo no', async () => {
    const check = '/api/permissions/audit-log.view/holders';
    const pc = openAuditLog({ [check]: { body: { roles: [], grantedBy: [] } } });
    await screen.findByText('25 acciones');
    await listening(pc);
    pc.refuse('not-found');
    await settle();
    expect(lists(pc, check)).toBe(0);
    pc.refuse('forbidden');
    await waitFor(() => expect(lists(pc, check)).toBe(1));
    expect(lists(pc)).toBe(1);
  });

  it('apagado suelta el tema un rato después; prenderlo antes pide en el momento', async () => {
    const pc = openAuditLog();
    await screen.findByText('25 acciones');
    await listening(pc);
    fireEvent.click(toggle());
    pc.notice();
    await settle(10);
    expect(pc.listening()).toEqual(['audit-log.new']);
    expect(lists(pc)).toBe(1);
    fireEvent.click(toggle());
    await waitFor(() => expect(lists(pc)).toBe(2));
    fireEvent.click(toggle());
    await settle(60);
    expect(pc.listening()).toEqual([]);
    fireEvent.click(toggle());
    await listening(pc);
  });

  it('el aviso del alta no vuelve a pedir una lista recién traída; uno que llega mientras se trae, espera', async () => {
    live.everyMs = 400;
    const answer = held({ body: later });
    const pc = openAuditLog({ [first]: [{ body: page() }, answer.reply, { body: later }] });
    await screen.findByText('25 acciones');
    await listening(pc);
    pc.notice({ subscribed: true });
    await settle();
    expect(lists(pc)).toBe(1);
    // Lo pide la persona (desde el otro dispositivo) y tarda: el aviso espera y prueba después.
    receive(
      'audit-log.list.asked',
      JSON.stringify({ filters: {}, page: 1, dates: true, round: 30 }),
    );
    await settle(420);
    pc.notice();
    await settle(10);
    expect(lists(pc)).toBe(2);
    answer.release();
    await waitFor(() => expect(lists(pc)).toBe(3), { timeout: 2000 });
  });

  it('si lo que se desplaza es lo que contiene a la lista, más abajo también cuenta las nuevas', async () => {
    const pc = openAuditLog({ [newOnes]: { body: { count: 2 } } });
    await screen.findByText('25 acciones');
    await listening(pc);
    (document.getElementById('app') as HTMLElement).scrollTop = 300;
    pc.notice();
    await screen.findByRole('button', { name: /2 nuevas/ });
    expect(lists(pc)).toBe(1);
  });

  it('sin acciones también se pone al día; mientras se trae lo que pidió la persona, no', async () => {
    const empty = page({ total: 0, pages: 1, events: [], days: {}, strip: [] });
    const answer = held({ body: page() });
    const pc = openAuditLog({ [first]: [{ body: empty }, { body: page() }, answer.reply] });
    await screen.findByText('Todavía no hay nada anotado.');
    await listening(pc);
    pc.notice();
    await screen.findByText('25 acciones');
    // Lo mismo, pedido de nuevo desde el otro dispositivo, que tarda.
    receive(
      'audit-log.list.asked',
      JSON.stringify({ filters: {}, page: 1, dates: true, round: 20 }),
    );
    await settle(70);
    pc.notice();
    await settle();
    expect(lists(pc)).toBe(3);
    answer.release();
  });
});
