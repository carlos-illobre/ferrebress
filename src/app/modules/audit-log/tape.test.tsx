// La cinta (05 · R4.11): abrirla desde la tira o desde «Ver el día», el cabezal, «Reproducir el
// día», aislar a alguien, cambiar de día y cerrarla. Sus reglas sin dibujo, en tape-rules.test.ts.
import type { AuditDay } from '@ferrebress/shared/contracts/audit-log';
import { act, fireEvent, screen, waitFor } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { detail, events, openAuditLog, rows } from './audit-test-kit.tsx';
import { stepMs } from './tape.ts';

const today = events.slice(0, 4).toReversed();
const week = ['22', '23', '24', '25', '26', '27', '28'].map((day, index) => ({
  date: `2026-10-${day}`,
  total: index === 6 ? 4 : index,
  amber: index === 6 ? 2 : 0,
  red: index === 5 ? 1 : 0,
}));
const day = (more: Partial<AuditDay> = {}): AuditDay => ({
  date: '2026-10-28',
  today: '2026-10-28',
  week,
  events: today,
  ...more,
});
const dayPath = (date: string) => `/api/audit-log/day?date=${date}`;
const subtitle = () => document.querySelector('.tape-subtitle')?.textContent ?? '';
// Toca la tira en ese punto, de 0 a 1 (con una tira de 1000 px de ancho).
async function touchStrip(at: number) {
  const strip = await screen.findByRole('button', { name: 'Ver el día como una grabación' });
  const rail = strip.querySelector('.audit-rail') as HTMLElement;
  rail.getBoundingClientRect = () => ({ left: 0, width: 1000 }) as DOMRect;
  fireEvent.click(strip, { clientX: at * 1000, detail: 1 });
}
const button = (name: RegExp) => screen.getByRole('button', { name }) as HTMLButtonElement;

describe('la cinta', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('audit-log-E40, E43: tocar la tira abre la cinta a pantalla completa, en esa acción, con la línea de quién a quién', async () => {
    const server = openAuditLog({ [dayPath('2026-10-28')]: { body: day() } });
    await touchStrip(0.95);
    await waitFor(() => expect(subtitle()).toContain('Ana Gómez le sacó el rol Cajero a Martín'));
    expect(server.sent.at(-1)?.path).toBe(dayPath('2026-10-28'));
    expect(screen.getByRole('dialog', { name: 'El día, como una grabación' })).toBeTruthy();
    expect(document.querySelector('.tape-line.on')).toBeTruthy();
    expect(document.querySelectorAll('.tape-lane')).toHaveLength(3);
    expect(document.querySelector('.tape-lane')?.textContent).toContain('Alguien sin entrar');
  });

  it('audit-log-E44, E42: ← → de a una, sin pasarse; cerrar vuelve a la lista como estaba', async () => {
    openAuditLog({ [dayPath('2026-10-28')]: { body: day() } });
    await screen.findByRole('button', { name: 'Ver el día como una grabación' });
    // La acción elegida antes de abrir la cinta sigue elegida al cerrarla.
    fireEvent.click(rows()[2] as HTMLElement);
    await touchStrip(0.2);
    await waitFor(() =>
      expect(subtitle()).toContain('no se pudo confirmar su entrada sin conexión'),
    );
    expect(button(/Acción anterior/).disabled).toBe(true);
    fireEvent.click(button(/Acción siguiente/));
    expect(subtitle()).toContain('cambió los permisos del rol Encargado');
    fireEvent.click(button(/Acción siguiente/));
    fireEvent.click(button(/Acción siguiente/));
    expect(subtitle()).toContain('le sacó el rol Cajero');
    expect(button(/Acción siguiente/).disabled).toBe(true);
    fireEvent.click(button(/Acción anterior/));
    expect(subtitle()).toContain('intentó entrar con un correo no autorizado');
    // Tocar un punto lleva el cabezal ahí.
    fireEvent.click(document.querySelector('.tape-dot') as HTMLElement);
    expect(subtitle()).toContain('no se pudo confirmar');
    fireEvent.click(screen.getAllByRole('button', { name: /Cerrar/ })[0] as HTMLElement);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('25 acciones')).toBeTruthy();
    expect(screen.getByText('página 1 de 2')).toBeTruthy();
    expect(rows()[2]?.getAttribute('aria-selected')).toBe('true');
    expect(detail()).toContain('cambió los permisos del rol Encargado');
  });

  it('audit-log-E45: «Reproducir el día» recorre en orden y se detiene en la última o al tocar algo', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    openAuditLog({ [dayPath('2026-10-28')]: { body: day() } });
    await touchStrip(0.2);
    await waitFor(() => expect(subtitle()).toContain('no se pudo confirmar'));
    fireEvent.click(button(/Reproducir el día/));
    act(() => {
      vi.advanceTimersByTime(stepMs(4, true));
    });
    expect(subtitle()).toContain('cambió los permisos');
    expect(button(/Pausar/)).toBeTruthy();
    // Tocar el botón no lo detiene (lo hace el botón); tocar cualquier otra cosa, sí.
    fireEvent.pointerDown(button(/Pausar/));
    expect(button(/Pausar/)).toBeTruthy();
    fireEvent.pointerDown(document.querySelector('.tape-board') as HTMLElement);
    expect(button(/Reproducir el día/)).toBeTruthy();
    // El botón espera a que termine lo que hizo antes de aceptar otro toque.
    await act(async () => undefined);
    fireEvent.click(button(/Reproducir el día/));
    for (let step = 0; step < 4; step++) {
      act(() => {
        vi.advanceTimersByTime(stepMs(4, true));
      });
    }
    expect(subtitle()).toContain('le sacó el rol Cajero');
    expect(button(/Reproducir el día/)).toBeTruthy();
    // Ocultar la aplicación también lo detiene.
    await act(async () => undefined);
    fireEvent.click(button(/Reproducir el día/));
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(button(/Reproducir el día/)).toBeTruthy();
  });

  it('audit-log-E46: tocar una fila aísla a esa persona, y tocarla de nuevo la suelta', async () => {
    openAuditLog({ [dayPath('2026-10-28')]: { body: day() } });
    await touchStrip(0.95);
    await waitFor(() => expect(subtitle()).toContain('le sacó el rol Cajero'));
    const outsider = button(/Ver solo a Alguien sin entrar/);
    fireEvent.click(outsider);
    expect(outsider.getAttribute('aria-pressed')).toBe('true');
    expect(subtitle()).toContain('intentó entrar');
    expect(button(/Acción siguiente/).disabled).toBe(true);
    expect(document.querySelectorAll('.tape-dot.off')).toHaveLength(3);
    fireEvent.click(outsider);
    expect(document.querySelectorAll('.tape-dot.off')).toHaveLength(0);
    // Al aislar a alguien que no está en el cabezal, el cabezal va a su primera acción.
    fireEvent.click(button(/Ver solo a Ana Gómez/));
    expect(subtitle()).toContain('cambió los permisos');
  });

  it('audit-log-E44: el cabezal se arrastra y se pega a la acción más cercana', async () => {
    openAuditLog({ [dayPath('2026-10-28')]: { body: day() } });
    await touchStrip(0.95);
    await waitFor(() => expect(subtitle()).toContain('le sacó el rol Cajero'));
    const track = document.querySelector('.tape-track') as HTMLElement;
    track.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1000, height: 400 }) as DOMRect;
    let captured = false;
    track.setPointerCapture = () => {
      captured = true;
    };
    track.hasPointerCapture = () => captured;
    fireEvent.pointerMove(track, { clientX: 0 });
    expect(subtitle()).toContain('le sacó el rol Cajero');
    fireEvent.pointerDown(track, { clientX: 0, pointerId: 1 });
    expect(subtitle()).toContain('no se pudo confirmar');
    fireEvent.pointerMove(track, { clientX: 1000, pointerId: 1 });
    expect(subtitle()).toContain('le sacó el rol Cajero');
  });

  it('audit-log-E46: con alguien aislado, Escape primero lo suelta y después cierra', async () => {
    openAuditLog({ [dayPath('2026-10-28')]: { body: day() } });
    await touchStrip(0.95);
    await waitFor(() => expect(subtitle()).toContain('le sacó'));
    fireEvent.click(button(/Ver solo a Ana Gómez/));
    const closing = () => document.querySelector<HTMLElement>('.tape [data-close]');
    expect(closing()?.getAttribute('aria-label')).toMatch(/Ver solo a Ana Gómez/);
    fireEvent.click(closing() as HTMLElement);
    expect(document.querySelectorAll('.tape-dot.off')).toHaveLength(0);
    fireEvent.click(closing() as HTMLElement);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('audit-log-E44: en el celular, deslizar de lado pasa de a una, sin pasarse', async () => {
    openAuditLog({ [dayPath('2026-10-28')]: { body: day() } }, true);
    const see = await screen.findByRole('button', { name: /Ver el día/ });
    await waitFor(() => expect((see as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(see);
    await waitFor(() => expect(subtitle()).toContain('no se pudo confirmar'));
    const tape = document.querySelector('.tape') as HTMLElement;
    const swipe = (dx: number) => {
      fireEvent.pointerDown(tape, { clientX: 200, clientY: 300 });
      fireEvent.pointerUp(tape, { clientX: 200 + dx, clientY: 300 });
    };
    swipe(80);
    expect(subtitle()).toContain('no se pudo confirmar');
    swipe(-80);
    expect(subtitle()).toContain('cambió los permisos');
    swipe(20);
    expect(subtitle()).toContain('cambió los permisos');
    fireEvent.pointerUp(tape, { clientX: 0, clientY: 0 });
    swipe(80);
    expect(subtitle()).toContain('no se pudo confirmar');
    // En el celular el tiempo va hacia abajo: el cabezal se arrastra de arriba abajo.
    const track = document.querySelector('.tape-track') as HTMLElement;
    track.getBoundingClientRect = () => ({ left: 0, top: 0, width: 300, height: 1000 }) as DOMRect;
    fireEvent.pointerDown(track, { clientX: 0, clientY: 1000, pointerId: 1 });
    expect(subtitle()).toContain('le sacó el rol Cajero');
  });

  it('audit-log-E40: con el teclado, la tira abre la cinta en la acción más nueva', async () => {
    openAuditLog({ [dayPath('2026-10-28')]: { body: day() } });
    fireEvent.click(await screen.findByRole('button', { name: 'Ver el día como una grabación' }), {
      detail: 0,
    });
    await waitFor(() => expect(subtitle()).toContain('le sacó el rol Cajero'));
  });

  it('audit-log-E47, E48: cambiar de día; un día sin acciones, y uno con demasiadas', async () => {
    openAuditLog({
      [dayPath('2026-10-28')]: { body: day() },
      [dayPath('2026-10-27')]: { body: day({ date: '2026-10-27', events: [events[4] as never] }) },
      [dayPath('2026-10-26')]: { body: day({ date: '2026-10-26', events: [] }) },
      [dayPath('2026-10-25')]: {
        body: day({ date: '2026-10-25', tooMany: 2_400, events: undefined as never }),
      },
    });
    await touchStrip(0.95);
    await waitFor(() => expect(subtitle()).toContain('le sacó'));
    const days = () => [...document.querySelectorAll<HTMLElement>('.tape-day')];
    expect(days().at(-1)?.textContent).toContain('Hoy');
    fireEvent.click(days()[5] as HTMLElement);
    await waitFor(() =>
      expect(subtitle()).toContain('El sistema terminó la sesión de Pedro: venció por no usarla'),
    );
    fireEvent.click(days()[4] as HTMLElement);
    await screen.findByText('Ese día no hubo acciones.');
    fireEvent.click(days()[3] as HTMLElement);
    await screen.findByText(/Ese día tiene 2.400 acciones/);
  });

  it('audit-log-E41, E42: en el celular, «Ver el día» abre la cinta vertical del día del resumen; atrás la cierra', async () => {
    openAuditLog({ [dayPath('2026-10-28')]: { body: day() } }, true);
    const see = await screen.findByRole('button', { name: /Ver el día/ });
    await waitFor(() => expect((see as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(see);
    await waitFor(() => expect(subtitle()).toContain('no se pudo confirmar'));
    expect(document.querySelector('.tape.vertical')).toBeTruthy();
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('si no se puede traer el día, la cinta queda sin acciones', async () => {
    openAuditLog({ [dayPath('2026-10-28')]: { status: 500, body: { error: 'unexpected' } } });
    await touchStrip(0.95);
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());
    expect(document.querySelector('.tape-board')).toBeNull();
  });
});
