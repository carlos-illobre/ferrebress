// Una pantalla pide un tema mientras está montada, y cambiar lo que hace con cada evento no lo
// vuelve a pedir.
import { act, render } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import type { TopicHandler } from './channel.ts';

const wanted: { token: string; handler: TopicHandler; released: boolean }[] = [];
vi.mock('./channel.ts', () => ({
  realtime: {
    want: (token: string, handler: TopicHandler) => {
      const entry = { token, handler, released: false };
      wanted.push(entry);
      return () => {
        entry.released = true;
      };
    },
  },
}));

const { useTopic } = await import('./use-topic.ts');

function Screen({ token, onEvent }: { token?: string; onEvent: (data: unknown) => void }) {
  useTopic(token, {
    onEvent,
    onRefused: () => onEvent('rechazo'),
    onDropped: () => onEvent('baja'),
  });
  return null;
}

describe('pedir un tema desde una pantalla', () => {
  it('lo pide al montarse, avisa con lo último que hace y lo suelta al desmontarse', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const view = render(<Screen token="test.news" onEvent={first} />);
    view.rerender(<Screen token="test.news" onEvent={second} />);
    expect(wanted).toHaveLength(1);
    const { handler } = wanted[0] as (typeof wanted)[number];
    handler.onEvent({ count: 1 });
    handler.onRefused?.('x');
    handler.onDropped?.();
    expect(first).not.toHaveBeenCalled();
    expect(second.mock.calls).toEqual([[{ count: 1 }], ['rechazo'], ['baja']]);
    act(() => view.unmount());
    expect(wanted[0]?.released).toBe(true);
  });

  it('sin tema no pide nada', () => {
    const before = wanted.length;
    render(<Screen onEvent={vi.fn()} />);
    expect(wanted).toHaveLength(before);
  });
});
