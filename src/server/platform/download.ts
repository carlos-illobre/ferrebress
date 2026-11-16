// Devolver un archivo para bajar (08 · R4.4, E40): de a partes, sin tenerlo entero en memoria, y con
// las cabeceras que hacen que el navegador lo baje y nunca lo abra (E68): `attachment`, un tipo que no
// se interpreta y `nosniff`. El nombre es el original, escrito según RFC 6266: uno de reserva con
// solo letras comunes y el verdadero en UTF-8. Los caracteres de control y los que dan vuelta el texto
// se sacan antes.
const unsafe = /[\p{Cc}\p{Cf}"\\/]/gu;

export const cleanFileName = (name: string): string =>
  name.replace(unsafe, '').trim().slice(0, 200) || 'lista';

export function download(chunks: AsyncIterable<Uint8Array>, name: string): Response {
  const clean = cleanFileName(name);
  const fallback = clean.normalize('NFD').replace(/[^\x20-\x7E]/g, '_');
  // De a una parte, cuando quien baja la pide: así no se junta el archivo entero en memoria.
  const parts = chunks[Symbol.asyncIterator]();
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const part = await parts.next();
      if (part.done) controller.close();
      else controller.enqueue(part.value);
    },
    async cancel() {
      await parts.return?.();
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(clean)}`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    },
  });
}
