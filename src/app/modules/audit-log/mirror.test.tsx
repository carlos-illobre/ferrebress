// Quién hizo qué en los dos dispositivos (diseño de 03, § 5.1): lo pedido viaja y cada uno lo pide con
// su tamaño; lo que llega roto vuelve a la primera página.
import { act, waitFor } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { mirror } from '../../platform/mirror/registry.ts';
import { first, openAuditLog } from './audit-test-kit.tsx';

describe('lo pedido, desde el otro dispositivo', () => {
  it('lo que llega del otro se pide acá; lo que no se entiende, la primera página', async () => {
    const server = openAuditLog();
    await waitFor(() => expect(server.sent.map((s) => s.path)).toContain(first));
    const asked = JSON.stringify({ filters: {}, page: 2, dates: false, round: 1 });
    act(() => mirror.receive([{ k: 'audit-log.list.asked', v: asked, c: 900, l: true }]));
    await waitFor(() =>
      expect(server.sent.map((s) => s.path)).toContain('/api/audit-log?page=2&size=20'),
    );
    const before = server.sent.filter((s) => s.path === first).length;
    act(() => mirror.receive([{ k: 'audit-log.list.asked', v: '{roto', c: 901, l: true }]));
    await waitFor(() =>
      expect(server.sent.filter((s) => s.path === first).length).toBe(before + 1),
    );
  });
});
