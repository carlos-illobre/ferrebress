// La oferta y la respuesta de WebRTC, revisadas por el servidor antes de pasarlas (diseño de 03, § 4.2 y
// § 16): un solo canal de datos y, de las direcciones, solo las del Wi-Fi del local en UDP (un nombre
// `.local` o una dirección privada). Así ni las direcciones reales que Chrome pone con el permiso de la
// cámara ni las de otras redes llegan al otro dispositivo. La descripción nunca se anota.

// Las direcciones que pueden pasar: mDNS, IPv4 privadas, IPv6 privadas y de enlace local.
const local = [
  /\.local$/i,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^f[cd][0-9a-f]{2}:/i,
  /^fe80:/i,
];

// Una línea `a=candidate:` que sirve: UDP, `typ host` y una dirección local.
function keeps(line: string): boolean {
  const [, , protocol = '', , address = '', , , type = ''] = line.slice(12).split(' ');
  return protocol.toLowerCase() === 'udp' && type === 'host' && local.some((p) => p.test(address));
}

export type Checked = { sdp: string; fingerprint: string };

// La descripción filtrada y la huella DTLS que trae, o nada si no es un solo canal de datos.
export function checkSdp(sdp: string): Checked | undefined {
  const lines = sdp.split(/\r?\n/).filter((line) => line.length > 0);
  const media = lines.filter((line) => line.startsWith('m='));
  if (media.length !== 1 || !media[0]?.startsWith('m=application ')) return undefined;
  const fingerprint = lines
    .find((line) => line.startsWith('a=fingerprint:'))
    ?.slice(14)
    .trim();
  if (!fingerprint) return undefined;
  const kept = lines.filter((line) => !line.startsWith('a=candidate:') || keeps(line));
  return { sdp: `${kept.join('\r\n')}\r\n`, fingerprint };
}
