// Lo de mentira de las capturas del vínculo, que corre adentro de la página (addInitScript): la
// conexión directa, que abre sola con 8 ms de latencia, y la cámara, un fondo liso que no lee nada.
// Así cada captura sale igual, sin red ni cámara de verdad.

// La conexión directa de mentira: abre sola al ofrecer o al responder, con 8 ms de latencia.
export function fakeWebRtc(): void {
  const sdp = [
    'v=0',
    'm=application 9 UDP/DTLS/SCTP webrtc-datachannel',
    'c=IN IP4 0.0.0.0',
    'a=fingerprint:sha-256 AA:BB:CC',
    'a=candidate:1 1 udp 2122260223 captura.local 5000 typ host',
    '',
  ].join('\r\n');
  const channel = () => {
    const target = new EventTarget();
    setTimeout(() => target.dispatchEvent(new Event('open')), 30);
    return Object.assign(target, { send: () => undefined, close: () => undefined });
  };
  class FakeConnection extends EventTarget {
    static generateCertificate = async () => ({});
    localDescription: { type: string; sdp: string } | null = null;
    iceGatheringState = 'complete';
    iceConnectionState = 'connected';
    createDataChannel = () => channel();
    createOffer = async () => ({ type: 'offer', sdp });
    createAnswer = async () => ({ type: 'answer', sdp });
    async setLocalDescription(description: { type: string; sdp: string }) {
      this.localDescription = description;
      if (description.type !== 'answer') return;
      const event = Object.assign(new Event('datachannel'), { channel: channel() });
      setTimeout(() => this.dispatchEvent(event), 10);
    }
    setRemoteDescription = async () => undefined;
    getStats = async () =>
      new Map([['par', { type: 'candidate-pair', nominated: true, currentRoundTripTime: 0.008 }]]);
    close = () => undefined;
  }
  Object.assign(window, { RTCPeerConnection: FakeConnection });
}

// La cámara de mentira: un fondo liso, sin leer nada.
export function fakeCamera(): void {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const paint = canvas.getContext('2d') as CanvasRenderingContext2D;
  paint.fillStyle = '#3b4a44';
  paint.fillRect(0, 0, 640, 480);
  Object.defineProperty(navigator, 'mediaDevices', {
    value: { getUserMedia: async () => canvas.captureStream(1) },
  });
  Object.assign(window, {
    BarcodeDetector: class {
      detect = async () => [];
    },
  });
}
