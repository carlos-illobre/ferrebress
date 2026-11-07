import { act, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { stubMedia } from '../testing/media.ts';
import { motionOff, still, useSystemStill, watchMotion } from './motion.ts';

const marked = () => document.documentElement.dataset.motion;

describe('el movimiento de la aplicación', () => {
  afterEach(() => {
    motionOff.set(false);
    delete document.documentElement.dataset.motion;
    vi.unstubAllGlobals();
  });

  it('device-settings-E13: apagado por la persona, marca <html> en el momento y vuelve al prenderlo', () => {
    stubMedia(() => false);
    const stop = watchMotion();
    expect(marked()).toBeUndefined();
    motionOff.set(true);
    expect(marked()).toBe('off');
    expect(still()).toBe(true);
    motionOff.set(false);
    expect(marked()).toBeUndefined();
    stop();
    motionOff.set(true);
    expect(marked()).toBeUndefined();
  });

  it('device-settings-E15: si el sistema pide no animar, manda el sistema, también si cambia con la aplicación abierta', () => {
    let reduce = false;
    const media = stubMedia((query) => query.includes('reduce') && reduce);
    watchMotion();
    function Shows() {
      return <p>{useSystemStill() ? 'quieto' : 'se mueve'}</p>;
    }
    const { unmount } = render(<Shows />);
    expect(screen.getByText('se mueve')).toBeTruthy();
    reduce = true;
    act(() => media.changed());
    expect(screen.getByText('quieto')).toBeTruthy();
    expect(marked()).toBe('off');
    expect(motionOff.get()).toBe(false);
    expect(still()).toBe(true);
    unmount();
    // Ya desmontada, no escucha más al sistema.
    reduce = false;
    act(() => media.changed());
    expect(still()).toBe(false);
  });
});
