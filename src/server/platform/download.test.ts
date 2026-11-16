import { describe, expect, it } from 'vitest';
import { cleanFileName, download } from './download.ts';

async function* parts() {
  yield new TextEncoder().encode('Código;');
  yield new TextEncoder().encode('Precio');
}

describe('bajar un archivo (08 · E40, E68)', () => {
  it('lo manda entero, para bajar y nunca abrir, con su nombre original', async () => {
    const response = download(parts(), 'Lista Ñandú 14-8.xlsx');
    expect(await response.text()).toBe('Código;Precio');
    expect(response.headers.get('Content-Type')).toBe('application/octet-stream');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('Content-Disposition')).toBe(
      `attachment; filename="Lista N_andu_ 14-8.xlsx"; filename*=UTF-8''Lista%20%C3%91and%C3%BA%2014-8.xlsx`,
    );
  });

  it('el nombre, sin saltos de línea, comillas, barras ni lo que da vuelta el texto', () => {
    expect(cleanFileName('lista\r\nSet-Cookie: x".xlsx')).toBe('listaSet-Cookie: x.xlsx');
    expect(cleanFileName(`fdp${String.fromCharCode(0x202e)}slx.exe`)).toBe('fdpslx.exe');
    expect(cleanFileName('../../etc/passwd')).toBe('....etcpasswd');
    expect(cleanFileName('\u0000')).toBe('lista');
  });

  it('de a una parte cuando se pide; si se deja de bajar, no sigue leyendo', async () => {
    let finished = false;
    async function* slow() {
      try {
        yield new TextEncoder().encode('uno');
        yield new TextEncoder().encode('dos');
      } finally {
        finished = true;
      }
    }
    const response = download(slow(), 'lista.csv');
    const reader = (response.body as ReadableStream<Uint8Array>).getReader();
    expect(new TextDecoder().decode((await reader.read()).value)).toBe('uno');
    expect(finished).toBe(false);
    await reader.cancel();
    expect(finished).toBe(true);
  });
});
