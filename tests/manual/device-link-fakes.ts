// Lo de mentira de las capturas del vínculo, que corre adentro de la página (addInitScript): la
// conexión directa, que abre sola con 8 ms de latencia, y la cámara, un fondo liso. Así cada captura
// sale igual, sin red ni cámara de verdad. En el clip, con la computadora y el celular en dos marcos
// de la misma página, el directo pasa lo que se manda de un marco al otro (el espejo anda de
// verdad) y la cámara del celular lee el código al rato.

// La conexión directa de mentira: abre sola al ofrecer o al responder, con 8 ms de latencia; lo que
// se manda llega al otro marco de la misma página, si hay.
export function fakeWebRtc(): void {
  const sdp = [
    'v=0',
    'm=application 9 UDP/DTLS/SCTP webrtc-datachannel',
    'c=IN IP4 0.0.0.0',
    'a=fingerprint:sha-256 AA:BB:CC',
    'a=candidate:1 1 udp 2122260223 captura.local 5000 typ host',
    '',
  ].join('\r\n');
  const bus = new BroadcastChannel('captura-directo');
  const channel = () => {
    const target = new EventTarget();
    setTimeout(() => target.dispatchEvent(new Event('open')), 30);
    bus.addEventListener('message', (event) => {
      if (event.data.from !== window.name)
        target.dispatchEvent(new MessageEvent('message', { data: event.data.text }));
    });
    const send = (text: string) => bus.postMessage({ from: window.name, text });
    return Object.assign(target, { send, close: () => undefined });
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

// La cámara de mentira: un fondo liso. Con `reads`, lee ese texto al segundo y medio de mirar.
export function fakeCamera(reads?: string): void {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const paint = canvas.getContext('2d') as CanvasRenderingContext2D;
  paint.fillStyle = '#3b4a44';
  paint.fillRect(0, 0, 640, 480);
  Object.defineProperty(navigator, 'mediaDevices', {
    value: { getUserMedia: async () => canvas.captureStream(1) },
  });
  // Un lienzo quieto no da cuadros nuevos: sin esto, el video esperaría el primero para siempre.
  HTMLMediaElement.prototype.play = async () => undefined;
  Object.assign(window, {
    BarcodeDetector: class {
      looks = 0;
      detect = async () => (reads && ++this.looks > 6 ? [{ rawValue: reads }] : []);
    },
  });
}
