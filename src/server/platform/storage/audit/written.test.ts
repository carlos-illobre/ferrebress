// El aviso de lo escrito (diseño de 05, § 7.1): una vez por tanda con algo, después de escribirla y
// fuera de la pila de quien la hizo correr; un error de quien escucha no corta nada.
import { describe, expect, it, vi } from 'vitest';
import { inMemoryAudit, openAuditLog } from './write.ts';

const event = { type: 'sign-out', at: new Date('2026-11-04T13:00:00Z'), actor: { kind: 'system' } };
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('el aviso de lo escrito', () => {
  it('avisa una vez por tanda con algo, después de escribirla, y se puede dejar de escuchar', async () => {
    const audit = openAuditLog(inMemoryAudit);
    const seen: number[] = [];
    const stop = audit.onWritten(() => seen.push(audit.read(2026).length));
    audit.flush();
    audit.record(event as never);
    audit.record(event as never);
    audit.flush();
    // Todavía no: corre fuera de la pila de quien escribió.
    expect(seen).toEqual([]);
    await settle();
    expect(seen).toEqual([2]);
    stop();
    audit.record(event as never);
    audit.flush();
    await settle();
    expect(seen).toEqual([2]);
    audit.close();
  });

  it('un error de quien escucha no corta la escritura ni a los demás', async () => {
    const audit = openAuditLog(inMemoryAudit);
    const other = vi.fn();
    audit.onWritten(() => {
      throw new Error('se rompió');
    });
    audit.onWritten(other);
    audit.record(event as never);
    expect(() => audit.flush()).not.toThrow();
    await settle();
    expect(other).toHaveBeenCalledOnce();
    expect(audit.read(2026)).toHaveLength(1);
    audit.close();
  });
});
