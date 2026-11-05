// La oferta y la respuesta de WebRTC, revisadas por el servidor antes de pasarlas (diseño de 03, § 4.2
// y § 16): un solo canal de datos y, de las direcciones, solo las del Wi-Fi del local en UDP
// (`keepsCandidate`, la misma regla que usa la aplicación). Así ni las direcciones reales que Chrome
// pone con el permiso de la cámara ni las de otras redes llegan al otro. La descripción no se anota.
import { keptLines } from '@ferrebress/shared/peer/candidates';

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
  return { sdp: `${keptLines(sdp).join('\r\n')}\r\n`, fingerprint };
}
