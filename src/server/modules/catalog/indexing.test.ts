import { describe, expect, it, vi } from 'vitest';
import { refresher } from './indexing.ts';

describe('poner al día el índice', () => {
  it('con los productos que cambiaron; si falla, el índice entero de nuevo', async () => {
    const replace = vi.fn();
    const doc = { id: 'a', description: 'A', brand: null, codes: [], priced: false };
    const read = {
      docsOf: vi.fn(async () => ({ changed: [doc], gone: ['b'] })),
      docs: vi.fn(async () => [doc]),
    };
    await refresher({ replace }, () => read)(['a', 'b']);
    expect(replace).toHaveBeenLastCalledWith([doc], ['b']);
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    read.docsOf.mockRejectedValueOnce(new Error('la base se cayó'));
    await refresher({ replace }, () => read)(['a']);
    expect(replace).toHaveBeenLastCalledWith([doc], []);
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});
