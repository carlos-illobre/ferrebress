// Un Wi-Fi de mentira para el vínculo: conexiones WebRTC que se encuentran cuando una ofrece y otra
// responde, y abren su canal de datos cuando la que ofreció acepta, si el Wi-Fi deja (puede aislar los
// equipos, E18). Lo que se manda llega al otro en orden y después, como por la red; cerrar una punta
// cierra el canal de la otra.
import type { RtcChannel, RtcConnection } from '../platform/peer/rtc.ts';

const later = (run: () => void) => setTimeout(run, 0);

type Net = { isolates: boolean; offerer?: End; others: Map<End, End>; ends: Set<End> };

// Una punta: su canal de datos y quienes escuchan cada cosa.
class End {
  readonly messages = new Set<(text: string) => void>();
  readonly opens = new Set<() => void>();
  readonly closes = new Set<() => void>();
  readonly channels = new Set<(channel: RtcChannel) => void>();
  readonly states = new Set<(state: RTCIceConnectionState) => void>();
  closed = false;
  readonly channel: RtcChannel;

  private readonly net: Net;

  constructor(net: Net) {
    this.net = net;
    this.channel = {
      // Solo se manda con el canal abierto: el otro ya está.
      send: (text) => later(() => this.net.others.get(this)?.receive(text)),
      onMessage: (l) => void this.messages.add(l),
      onOpen: (l) => void this.opens.add(l),
      onClose: (l) => void this.closes.add(l),
    };
  }
  receive(text: string) {
    if (!this.closed) for (const l of this.messages) l(text);
  }
  open() {
    for (const l of this.opens) l();
  }
  hangUp() {
    if (this.closed) return;
    this.closed = true;
    for (const l of this.closes) l();
  }
  fail() {
    for (const l of this.states) l('failed');
  }
  emit() {
    for (const l of this.channels) l(this.channel);
  }
}

function connect(net: Net, self: End, sdp: string): RtcConnection {
  return {
    offer: async () => {
      net.offerer = self;
      self.emit();
      return sdp;
    },
    answer: async () => {
      const offerer = net.offerer as End;
      net.others.set(self, offerer);
      net.others.set(offerer, self);
      self.emit();
      return sdp;
    },
    accept: async () => {
      const other = net.others.get(self);
      if (!net.isolates && other)
        later(() => {
          self.open();
          other.open();
        });
    },
    gathered: async () => undefined,
    localDescription: () => sdp,
    onChannel: (l) => void self.channels.add(l),
    onState: (l) => void self.states.add(l),
    roundTripMs: async () => 8,
    close: () => {
      const other = net.others.get(self);
      self.hangUp();
      later(() => other?.hangUp());
    },
  };
}

export function createWifi() {
  const net: Net = { isolates: false, others: new Map(), ends: new Set() };
  return {
    // Cómo crea sus conexiones cada dispositivo, con su huella.
    rtc: (fingerprint: string) => async () => {
      const self = new End(net);
      net.ends.add(self);
      const sdp = `v=0\r\na=fingerprint:sha-256 ${fingerprint}\r\na=candidate:1 1 udp 1 x.local 5000 typ host\r\n`;
      return connect(net, self, sdp);
    },
    isolate: (value: boolean) => {
      net.isolates = value;
    },
    // El Wi-Fi se corta: todo directo falla.
    cut: () => {
      for (const end of net.ends) end.fail();
    },
  };
}
