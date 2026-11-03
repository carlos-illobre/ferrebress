import { describe, expect, it } from 'vitest';
import { createQuery } from './query.ts';
import { memorySource } from './source.ts';
import { inMemoryAudit, openAuditLog } from './write.ts';

const marcos = { kind: 'person' as const, userId: 'u-marcos', name: 'Marcos' };
const minute = 60_000;

// Dos años de una ferretería con mucho movimiento: 1.000 acciones por día. Tarda en armarse, así
// que corre solo con AUDIT_PERF=1 (diseño de 05, § 9).
describe.skipIf(!process.env.AUDIT_PERF)('quién hizo qué: con 730.000 acciones', () => {
  it('metas: la primera página, sus días y el resumen, en menos de un segundo', () => {
    const audit = openAuditLog(inMemoryAudit);
    const from = Date.parse('2025-01-01T03:00:00Z');
    const step = (730 * 24 * 60 * minute) / 730_000;
    for (let i = 0; i < 730_000; i++) {
      audit.record({
        type: i % 7 ? 'sign-out' : 'user.renamed',
        at: new Date(from + i * step),
        actor: marcos,
      });
      if (i % 10_000 === 0) audit.flush();
    }
    audit.flush();
    const query = createQuery(memorySource(audit), () => 2026);
    const day = 24 * 60 * minute;
    const lastDay = from + 729 * day;
    const started = performance.now();
    expect(query({ op: 'count', filter: {} })).toBe(730_000);
    query({ op: 'rows', filter: { actor: { userId: 'u-marcos' } }, offset: 0, limit: 20 });
    query({ op: 'spans', filter: {}, spans: [[lastDay, lastDay + day]] });
    query({ op: 'tones', filter: { from: lastDay - 6 * day, until: lastDay + day } });
    expect(performance.now() - started).toBeLessThan(1_000);
    audit.close();
  }, 600_000);
});
