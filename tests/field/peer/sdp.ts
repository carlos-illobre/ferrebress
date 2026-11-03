// La prueba de campo de la conexión directa (diseño de 03, § 21, tarea 1): la oferta y la respuesta
// de WebRTC viajan por un código QR entre los dos dispositivos, sin servidor. Para que el QR sea chico
// y la cámara de una notebook lo lea, de la descripción viaja solo lo que cambia entre una conexión y
// otra (las credenciales de ICE, la huella DTLS y los candidatos) y del otro lado se vuelve a armar.

export type Brief = {
  // Quién la armó: la oferta la arma la computadora y la respuesta el celular.
  kind: 'offer' | 'answer';
  ufrag: string;
  pwd: string;
  fingerprint: string;
  candidates: string[];
};

const prefix = 'FBP1:';

const line = (sdp: string, name: string): string => {
  const found = sdp.split(/\r?\n/).find((text) => text.startsWith(`a=${name}:`));
  if (!found) throw new Error(`La descripción no tiene a=${name}`);
  return found.slice(name.length + 3).trim();
};

// De la descripción completa, lo que viaja.
export function brief(kind: Brief['kind'], sdp: string): Brief {
  return {
    kind,
    ufrag: line(sdp, 'ice-ufrag'),
    pwd: line(sdp, 'ice-pwd'),
    fingerprint: line(sdp, 'fingerprint'),
    candidates: sdp
      .split(/\r?\n/)
      .filter((text) => text.startsWith('a=candidate:'))
      .map((text) => text.slice('a=candidate:'.length).trim()),
  };
}

// La descripción mínima de un canal de datos, con lo que llegó del otro lado.
export function rebuild(data: Brief): RTCSessionDescriptionInit {
  const sdp = [
    'v=0',
    'o=- 1 2 IN IP4 127.0.0.1',
    's=-',
    't=0 0',
    'a=group:BUNDLE 0',
    'a=msid-semantic: WMS',
    'm=application 9 UDP/DTLS/SCTP webrtc-datachannel',
    'c=IN IP4 0.0.0.0',
    `a=ice-ufrag:${data.ufrag}`,
    `a=ice-pwd:${data.pwd}`,
    `a=fingerprint:${data.fingerprint}`,
    // La computadora ofrece y deja elegir; el celular responde y abre la conexión DTLS.
    `a=setup:${data.kind === 'offer' ? 'actpass' : 'active'}`,
    'a=mid:0',
    'a=sctp-port:5000',
    'a=max-message-size:262144',
    ...data.candidates.map((candidate) => `a=candidate:${candidate}`),
    'a=end-of-candidates',
    '',
  ].join('\r\n');
  return { type: data.kind, sdp };
}

export const encode = (data: Brief): string => prefix + JSON.stringify(data);

// El texto de un QR, si es de esta prueba; si no, undefined (la cámara sigue leyendo).
export function decode(text: string, kind: Brief['kind']): Brief | undefined {
  if (!text.startsWith(prefix)) return undefined;
  try {
    const data = JSON.parse(text.slice(prefix.length)) as Brief;
    return data.kind === kind && Array.isArray(data.candidates) ? data : undefined;
  } catch {
    return undefined;
  }
}

// Qué clase de dirección es un candidato, sin mostrar la dirección: la primera que coincide.
const kinds: [(address: string) => boolean, string][] = [
  [(address) => address.endsWith('.local'), 'mDNS (.local)'],
  [(address) => /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(address), 'IPv4 privada'],
  [(address) => /^f[cd]/i.test(address), 'IPv6 privada'],
  [(address) => /^fe80/i.test(address), 'IPv6 de enlace local'],
  [(address) => address.includes(':'), 'IPv6 pública'],
  [() => true, 'IPv4 pública'],
];

export function addressKind(candidate: string): string {
  const [, , protocol = '', , address = '', , , type = ''] = candidate.split(' ');
  const kind = kinds.find(([matches]) => matches(address))?.[1];
  return `${type} ${protocol.toLowerCase()} · ${kind}`;
}
