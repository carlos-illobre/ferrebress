// Lectores (08 · pantalla 5, R5.8): los lectores por proveedor, buscar, activar y desactivar con
// «Deshacer», sin el permiso, sin conexión y vacía.
import { fireEvent, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { navigate, route } from '../../platform/router.ts';
import { topScreen } from '../../platform/screens.ts';
import { online } from '../../platform/server/api.ts';
import { startKeyboard } from '../../testing/keyboard.ts';
import {
  activeOf,
  openReaders,
  reader,
  readers,
  toast,
  viewer,
} from '../../views/basic/price-lists/readers-kit.tsx';
import { groupsOf, type Readers, readerLines } from './model.ts';

const groups = () => screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);

describe('Lectores', () => {
  it('price-lists-R5.8: agrupa por proveedor, con de dónde salió, desde cuándo y su última lista', async () => {
    openReaders();
    await screen.findByText('Bulonera Centro');
    expect(groups()).toEqual(['Bulonera Centro', 'Sin proveedor todavía', 'Ferretera del Sur']);
    expect(screen.getByText('Leyó lista.xlsx (lista del 14/08/2026)')).toBeTruthy();
    expect(screen.getAllByText('Todavía no leyó ninguna lista')).toHaveLength(3);
    expect(screen.getByText('Escrito por un programador')).toBeTruthy();
    expect(screen.getByText('Generado por IA')).toBeTruthy();
    expect(screen.getByText('Desactivado')).toBeTruthy();
  });

  it('busca por el nombre del proveedor, sin acentos ni mayúsculas', async () => {
    openReaders();
    const search = await screen.findByLabelText('Buscar por proveedor');
    fireEvent.input(search, { target: { value: 'FERRETERA' } });
    await waitFor(() => expect(groups()).toEqual(['Ferretera del Sur']));
    fireEvent.input(search, { target: { value: 'nadie' } });
    expect(await screen.findByText('Ningún proveedor con ese nombre.')).toBeTruthy();
  });

  it('price-lists-E50: desactivar uno avisa con «Deshacer», que lo vuelve a activar', async () => {
    const off = { ...(readers[0] as object), active: false };
    const server = openReaders({ [activeOf('r1')]: [{ body: off }, { body: readers[0] }] });
    await screen.findByText('Bulonera Centro');
    fireEvent.click(screen.getAllByRole('button', { name: 'Desactivar' })[0] as HTMLElement);
    await waitFor(() => expect(toast()).toContain('Automático: desactivado'));
    expect(screen.getAllByText('Desactivado')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Deshacer' }));
    await waitFor(() => expect(screen.getAllByText('Desactivado')).toHaveLength(1));
    expect(server.bodies(activeOf('r1'))).toEqual([{ active: false }, { active: true }]);
  });

  it('activar uno avisa; si el servidor no puede, lo dice', async () => {
    openReaders({
      [activeOf('r2')]: [
        { body: { ...(readers[1] as object), active: true } },
        { status: 500, body: { error: 'unexpected' } },
      ],
    });
    await screen.findByText('Bulonera Centro');
    fireEvent.click(screen.getByRole('button', { name: 'Activar' }));
    await waitFor(() => expect(toast()).toContain('Automático: activado'));
    fireEvent.click(screen.getAllByRole('button', { name: 'Desactivar' })[0] as HTMLElement);
    await waitFor(() => expect(toast()).toContain('No se pudo cambiar. Probá de nuevo.'));
  });

  it('sin «Cambiar los ajustes», se ve pero no se cambia, y dice qué falta', async () => {
    openReaders({}, viewer);
    await screen.findByText('Bulonera Centro');
    expect(
      screen.getByText('Para activar o desactivar un lector hace falta «Cambiar los ajustes».'),
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Desactivar' })).toBeNull();
  });

  it('vacía, dice que se crean solos', async () => {
    openReaders({ '/api/price-lists/readers': { body: { readers: [] } } });
    expect(await screen.findAllByText(/Todavía no hay lectores/)).not.toHaveLength(0);
  });

  it('si no se pudo traer, lo dice y reintenta', async () => {
    openReaders({
      '/api/price-lists/readers': [
        { status: 500, body: { error: 'unexpected' } },
        { body: { readers } },
      ],
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Bulonera Centro')).toBeTruthy();
  });

  it('volver lleva a los ajustes de Administración', async () => {
    navigate('/administration/readers');
    openReaders();
    await screen.findByText('Bulonera Centro');
    (topScreen()?.model() as Readers | undefined)?.back();
    expect(route.get().path).toBe('/administration');
  });
});

describe('Lectores sin conexión', () => {
  let stop: () => void;
  beforeEach(() => {
    stop = startKeyboard();
  });
  afterEach(() => stop());

  it('price-lists-R5.8: sin conexión muestra lo último que se vio, no deja cambiar y Alt R reintenta', async () => {
    const server = openReaders();
    await screen.findByText('Bulonera Centro');
    online.set(false);
    expect(await screen.findByText(/Sin conexión: es lo último que se vio/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Desactivar' })).toBeNull();
    const asked = () => server.sent.filter((s) => s.path === '/api/price-lists/readers').length;
    const before = asked();
    online.set(true);
    fireEvent.keyDown(window, { key: 'R', code: 'KeyR', altKey: true });
    await waitFor(() => expect(asked()).toBeGreaterThan(before));
  });
});

describe('las reglas de Lectores', () => {
  it('sin proveedor, el grupo se llama «Sin proveedor todavía»; una lista sin fecha no la dice', () => {
    const one = reader('x', { lastList: { id: 'l', fileName: 'a.csv' } });
    expect(groupsOf([one], '')).toEqual([{ supplier: 'Sin proveedor todavía', readers: [one] }]);
    expect(readerLines(one).last).toBe('Leyó a.csv');
  });
});
