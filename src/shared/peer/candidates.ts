// Las direcciones que se le pasan al otro dispositivo (diseño de 03, § 4.2): solo las del Wi-Fi del
// local en UDP, `typ host` con un nombre `.local` o una dirección privada. Con el permiso de la
// cámara, Chrome pone las direcciones reales de cada red (comprobado en la prueba de campo): no
// salen. La aplicación filtra al mandar y el servidor, con la misma regla, al recibir.
const local = [
  /\.local$/i,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^f[cd][0-9a-f]{2}:/i,
  /^fe80:/i,
];

export function keepsCandidate(line: string): boolean {
  const [, , protocol = '', , address = '', , , type = ''] = line.replace(/^a=/, '').split(' ');
  return protocol.toLowerCase() === 'udp' && type === 'host' && local.some((p) => p.test(address));
}

// La descripción sin las direcciones que no van.
export const filterCandidates = (sdp: string): string =>
  sdp
    .split(/\r?\n/)
    .filter((line) => line.length > 0 && (!line.startsWith('a=candidate:') || keepsCandidate(line)))
    .map((line) => `${line}\r\n`)
    .join('');

// La huella DTLS de una descripción (la que la confirmación compara, § 7).
export const fingerprintOf = (sdp: string): string | undefined =>
  /^a=fingerprint:(.+)$/m.exec(sdp)?.[1]?.trim();
