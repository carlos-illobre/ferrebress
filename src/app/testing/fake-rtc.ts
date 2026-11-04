// Un adaptador de WebRTC de mentira, para probar el transporte directo sin navegador: dos conexiones
// que se hablan entre sí, con lo que la prueba decida (que abra, que se corte, que falle).
import type { RtcChannel, RtcConnection } from '../platform/peer/rtc.ts';

type Listener<T> = (value: T) => void;

function fakeChannel() {
  const messages = new Set<Listener<string>>();
  const opens = new Set<() => void>();
  const closes = new Set<() => void>();
  const sent: string[] = [];
  const channel: RtcChannel = {
    // Lo que manda este lado lo ve la prueba en `sent`.
    send: (text) => void sent.push(text),
    onMessage: (l) => void messages.add(l),
    onOpen: (l) => void opens.add(l),
    onClose: (l) => void closes.add(l),
  };
  return {
    channel,
    sent,
    receive: (text: string) => {
      for (const l of messages) l(text);
    },
    open: () => {
      for (const l of opens) l();
    },
    close: () => {
      for (const l of closes) l();
    },
  };
}

export function fakeRtc(sdp: string) {
  const channels = new Set<Listener<RtcChannel>>();
  const states = new Set<Listener<RTCIceConnectionState>>();
  const made = fakeChannel();
  let closed = 0;
  const connection: RtcConnection = {
    offer: async () => {
      for (const l of channels) l(made.channel);
      return sdp;
    },
    answer: async () => {
      for (const l of channels) l(made.channel);
      return sdp;
    },
    accept: async () => undefined,
    gathered: async () => undefined,
    localDescription: () => sdp,
    onChannel: (l) => void channels.add(l),
    onState: (l) => void states.add(l),
    roundTripMs: async () => 8,
    close: () => void closed++,
  };
  return {
    connection,
    channel: made,
    state: (state: RTCIceConnectionState) => {
      for (const l of states) l(state);
    },
    closed: () => closed,
  };
}
