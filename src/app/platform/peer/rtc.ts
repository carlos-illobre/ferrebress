// El adaptador de WebRTC (diseño de 03, § 4.2): lo único que habla con el navegador. Una conexión con
// un solo canal de datos, sin STUN ni TURN, y el mismo certificado DTLS en toda la pestaña (su huella
// es la que la confirmación ata a la sesión, § 7). La lógica (plazos, filtro, cortes) está en
// `direct.ts`, que se prueba con un adaptador de mentira; esto se prueba en el navegador.

export type RtcChannel = {
  send(text: string): void;
  onMessage(listener: (text: string) => void): void;
  onOpen(listener: () => void): void;
  onClose(listener: () => void): void;
};

export type RtcConnection = {
  // La computadora ofrece (crea el canal) y el celular responde (lo recibe).
  offer(): Promise<string>;
  answer(remote: string): Promise<string>;
  accept(remote: string): Promise<void>;
  // Cuando ya no van a aparecer más direcciones: el navegador lo avisa, o pasa un rato sin nuevas.
  gathered(quietMs: number, capMs: number): Promise<void>;
  localDescription(): string;
  onChannel(listener: (channel: RtcChannel) => void): void;
  onState(listener: (state: RTCIceConnectionState) => void): void;
  roundTripMs(): Promise<number | undefined>;
  close(): void;
};

let certificate: Promise<RTCCertificate> | undefined;
const certificateOfTab = () =>
  (certificate ??= RTCPeerConnection.generateCertificate({
    name: 'ECDSA',
    namedCurve: 'P-256',
  } as EcKeyGenParams));

const wrap = (channel: RTCDataChannel): RtcChannel => ({
  send: (text) => channel.send(text),
  onMessage: (listener) => channel.addEventListener('message', (e) => listener(String(e.data))),
  onOpen: (listener) => channel.addEventListener('open', listener),
  onClose: (listener) => channel.addEventListener('close', listener),
});

export async function createRtcConnection(): Promise<RtcConnection> {
  const pc = new RTCPeerConnection({ iceServers: [], certificates: [await certificateOfTab()] });
  const channels = new Set<(channel: RtcChannel) => void>();
  pc.addEventListener('datachannel', (event) => {
    for (const listener of channels) listener(wrap(event.channel));
  });
  return {
    async offer() {
      const channel = pc.createDataChannel('mirror', { ordered: true });
      for (const listener of channels) listener(wrap(channel));
      await pc.setLocalDescription(await pc.createOffer());
      return pc.localDescription?.sdp ?? '';
    },
    async answer(remote) {
      await pc.setRemoteDescription({ type: 'offer', sdp: remote });
      await pc.setLocalDescription(await pc.createAnswer());
      return pc.localDescription?.sdp ?? '';
    },
    accept: (remote) => pc.setRemoteDescription({ type: 'answer', sdp: remote }),
    gathered: (quietMs, capMs) =>
      new Promise<void>((resolve) => {
        let quiet = setTimeout(resolve, quietMs);
        setTimeout(resolve, capMs);
        pc.addEventListener('icecandidate', () => {
          clearTimeout(quiet);
          quiet = setTimeout(resolve, quietMs);
        });
        pc.addEventListener('icegatheringstatechange', () => {
          if (pc.iceGatheringState === 'complete') resolve();
        });
      }),
    localDescription: () => pc.localDescription?.sdp ?? '',
    onChannel: (listener) => void channels.add(listener),
    onState: (listener) =>
      pc.addEventListener('iceconnectionstatechange', () => listener(pc.iceConnectionState)),
    async roundTripMs() {
      let rtt: number | undefined;
      (await pc.getStats()).forEach((entry) => {
        if (
          entry.type === 'candidate-pair' &&
          entry.nominated &&
          entry.currentRoundTripTime !== undefined
        )
          rtt = entry.currentRoundTripTime * 1000;
      });
      return rtt;
    },
    close: () => pc.close(),
  };
}
