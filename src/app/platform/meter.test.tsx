// El medidor (diseño de 05, § 8.1; 03 · E45, E46; 05 · R4.12): cuenta por tema y el total una vez,
// sobre el último minuto, y a los 60 s sin nada dice 0.
import { act, render } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMeter, kbPerMinute, useRate } from './meter.ts';
import { platformSettings } from './settings.ts';

describe('el medidor', () => {
  afterEach(() => vi.useRealTimers());

  it('cuenta el total una vez y cada tema por separado', () => {
    let now = 1_000_000;
    const meter = createMeter(() => now);
    meter.count(100, ['audit-log.new']);
    meter.count(50, ['device-link.pairing', 'device-link.pairing']);
    now += 3_000;
    meter.count(10);
    expect(meter.rate()).toBe(160);
    expect(meter.rate('audit-log.new')).toBe(100);
    expect(meter.rate('device-link.pairing')).toBe(50);
    expect(meter.rate('otro')).toBe(0);
  });

  it('E45: mide el último minuto, no acumula, y sin nada a los 60 s dice 0', () => {
    let now = 5_000_000;
    const meter = createMeter(() => now);
    meter.count(90, ['audit-log.new']);
    now += 30_000;
    meter.count(90, ['audit-log.new']);
    expect(meter.rate('audit-log.new')).toBe(180);
    now += 31_000;
    expect(meter.rate('audit-log.new')).toBe(90);
    now += 30_000;
    expect(meter.rate('audit-log.new')).toBe(0);
    expect(meter.rate()).toBe(0);
    // Una casilla que vuelve a usarse un minuto después empieza de cero.
    meter.count(5, ['audit-log.new']);
    expect(meter.rate('audit-log.new')).toBe(5);
  });

  it('dice los KB por minuto con una decimal y coma', () => {
    expect(kbPerMinute(0)).toBe('0 KB/min');
    expect(kbPerMinute(20)).toBe('0,0 KB/min');
    expect(kbPerMinute(2355)).toBe('2,3 KB/min');
  });

  it('se vuelve a leer cada pocos segundos solo con la pestaña a la vista', () => {
    vi.useFakeTimers();
    const meter = createMeter(() => Date.now());
    const seen: number[] = [];
    function Probe() {
      seen.push(useRate('audit-log.new', meter));
      return null;
    }
    const view = render(<Probe />);
    meter.count(200, ['audit-log.new']);
    act(() => void vi.advanceTimersByTime(platformSettings.meter.redrawMs));
    expect(seen.at(-1)).toBe(200);
    const hidden = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    act(() => void document.dispatchEvent(new Event('visibilitychange')));
    meter.count(300, ['audit-log.new']);
    act(() => void vi.advanceTimersByTime(platformSettings.meter.redrawMs * 2));
    expect(seen.at(-1)).toBe(200);
    hidden.mockRestore();
    act(() => void document.dispatchEvent(new Event('visibilitychange')));
    expect(seen.at(-1)).toBe(500);
    view.unmount();
  });
});
