import { describe, expect, it } from 'vitest';
import { deviceLabel, isPhone } from './device.ts';

const chromeWindows =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36';
const chromeAndroid =
  'Mozilla/5.0 (Linux; Android 14; moto e13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36';

describe('el nombre del dispositivo', () => {
  it.each([
    [chromeWindows, 'Chrome en Windows'],
    [chromeAndroid, 'Chrome en Android'],
    ['Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0', 'Firefox en Linux'],
    [
      'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/141.0 Safari/537.36 Edg/141.0',
      'Edge en Windows',
    ],
    [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15',
      'Safari en macOS',
    ],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Version/18.0 Mobile Safari/604.1',
      'Safari en iPhone',
    ],
    ['Notebook del mostrador, podés poner la huella', 'Otro navegador'],
  ])('%s → %s', (agent, label) => expect(deviceLabel(agent)).toBe(label));
});

describe('si es un celular', () => {
  it('lo dice el navegador, o se sabe por el sistema', () => {
    expect(isPhone(chromeWindows, '?1')).toBe(true);
    expect(isPhone(chromeAndroid, undefined)).toBe(true);
    expect(isPhone(chromeWindows, '?0')).toBe(false);
  });
});
