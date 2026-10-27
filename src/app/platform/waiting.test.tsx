import { act, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { later } from '../testing/later.ts';
import { useStore } from './store.ts';
import { useWaiting, waitBar } from './waiting.ts';

function Save({ task }: { task: () => Promise<unknown> }) {
  const { phase, run } = useWaiting();
  const bar = useStore(waitBar);
  return (
    <>
      <button
        type="button"
        data-phase={phase}
        onClick={() => run('Guardando', task).catch(() => {})}
      >
        Guardar
      </button>
      {bar && <p>{bar}</p>}
    </>
  );
}

const button = () => screen.getByRole('button');

describe('las esperas', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('app-E40: lo que responde antes de 300 ms no muestra ninguna espera', async () => {
    render(<Save task={() => new Promise((resolve) => setTimeout(resolve, 200))} />);
    fireEvent.click(button());
    expect(button().dataset.phase).toBe('quiet');
    await later(250);
    expect(button().dataset.phase).toBe('idle');
  });

  it('app-E41, app-E42: pasados 300 ms muestra la marca; pasados 2 s, la barra; al terminar, nada', async () => {
    let finish = () => {};
    render(<Save task={() => new Promise<void>((resolve) => (finish = resolve))} />);
    fireEvent.click(button());
    await later(300);
    expect(button().dataset.phase).toBe('mark');
    expect(screen.queryByText('Guardando')).toBeNull();
    await later(1700);
    expect(button().dataset.phase).toBe('bar');
    expect(screen.getByText('Guardando')).toBeTruthy();
    await act(async () => finish());
    expect(button().dataset.phase).toBe('idle');
    expect(screen.queryByText('Guardando')).toBeNull();
  });

  it('volver a tocar mientras espera no lo manda dos veces', async () => {
    const task = vi.fn(() => new Promise((resolve) => setTimeout(resolve, 500)));
    render(<Save task={task} />);
    fireEvent.click(button());
    fireEvent.click(button());
    await later(500);
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('si falla, también deja de esperar, y la barra de otra tarea no se borra', async () => {
    render(
      <Save
        task={() => new Promise((_, reject) => setTimeout(() => reject(new Error('x')), 2500))}
      />,
    );
    fireEvent.click(button());
    await later(2000);
    act(() => waitBar.set('Otra cosa'));
    await later(500);
    expect(button().dataset.phase).toBe('idle');
    expect(waitBar.get()).toBe('Otra cosa');
    waitBar.set(undefined);
  });
});
