// La prueba de campo de la conexión directa (diseño de 03, § 21, tarea 1). La computadora arma la
// oferta y la muestra en un QR; el celular la lee, arma la respuesta y la muestra en otro QR; la
// computadora la lee con su cámara (o se pega el texto). Con eso se abre el canal de datos por el
// Wi-Fi, sin STUN ni TURN, igual que en la aplicación, y la página mide si abrió, con qué candidatos,
// en cuánto y cuánto tarda un mensaje en ir y volver. El resultado se copia para mandarlo.
import qrcode from 'qrcode-generator';
import { addressKind, type Brief, brief, decode, encode, rebuild } from './sdp.ts';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const report: string[] = [];
const started = performance.now();
const ms = () => Math.round(performance.now() - started);

function log(text: string): void {
  report.push(`${String(ms()).padStart(6)} ms  ${text}`);
  $('log').textContent = report.join('\n');
}

const showQr = (text: string) => {
  const code = qrcode(0, 'L');
  code.addData(text);
  code.make();
  $('qr').innerHTML = code.createSvgTag({ cellSize: 6, margin: 4 });
  $<HTMLTextAreaElement>('own').value = text;
  $('give').hidden = false;
};

// La cámara: BarcodeDetector donde está (Chrome en Android) y ZXing donde no (Chrome en Windows).
type Detector = { detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]> };
type WithDetector = { BarcodeDetector?: new (options: { formats: string[] }) => Detector };

async function reader(): Promise<(video: HTMLVideoElement) => Promise<string | undefined>> {
  const Native = (globalThis as WithDetector).BarcodeDetector;
  if (Native) {
    const native = new Native({ formats: ['qr_code'] });
    return async (video) => (await native.detect(video))[0]?.rawValue;
  }
  const { BrowserQRCodeReader } = await import('@zxing/library');
  const zxing = new BrowserQRCodeReader();
  return async (video) => zxing.decodeOnce(video).then((result) => result.getText());
}

let cameraUsed = false;

async function scan(kind: Brief['kind'], onBrief: (data: Brief) => void): Promise<void> {
  const video = $<HTMLVideoElement>('video');
  $('take').hidden = false;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    });
    cameraUsed = true;
    log('cámara: permiso dado');
    video.srcObject = stream;
    await video.play();
    const read = await reader();
    const stop = () => {
      for (const track of stream.getTracks()) track.stop();
      $('take').hidden = true;
    };
    const tick = async () => {
      const text = await read(video).catch(() => undefined);
      const data = text ? decode(text, kind) : undefined;
      if (data) {
        stop();
        onBrief(data);
      } else setTimeout(tick, 250);
    };
    void tick();
  } catch (error) {
    log(`cámara: no se pudo (${(error as Error).name}); pegá el texto`);
  }
}

// El texto pegado, por si la notebook no tiene cámara o no lee el QR del celular.
function paste(kind: Brief['kind'], onBrief: (data: Brief) => void): void {
  $('paste-go').onclick = () => {
    const data = decode($<HTMLTextAreaElement>('paste').value.trim(), kind);
    if (data) onBrief(data);
    else log('el texto pegado no es de esta prueba');
  };
}

// Junta los candidatos. Sin servidores, el navegador puede no avisar nunca que terminó (pasa en
// Chromium sin pantalla): se sigue cuando avisa, a los 300 ms sin candidatos nuevos o a los 3 s. Se
// anota cuál de los tres fue, porque el diseño cuenta con presentarse en menos de 1 s.
const gathered = (pc: RTCPeerConnection, since: number) =>
  new Promise<void>((resolve) => {
    let quiet: ReturnType<typeof setTimeout> | undefined;
    const done = (how: string) => {
      clearTimeout(quiet);
      clearTimeout(limit);
      log(`candidatos: ${how} a los ${Math.round(performance.now() - since)} ms`);
      resolve();
    };
    const limit = setTimeout(() => done('tope de 3 s'), 3000);
    const settle = () => {
      clearTimeout(quiet);
      quiet = setTimeout(() => done('300 ms sin nuevos'), 300);
    };
    if (pc.iceGatheringState === 'complete') return done('el navegador terminó');
    settle();
    pc.addEventListener('icecandidate', (event) => (event.candidate ? settle() : undefined));
    pc.addEventListener('icegatheringstatechange', () => {
      if (pc.iceGatheringState === 'complete') done('el navegador terminó');
    });
  });

async function localBrief(
  pc: RTCPeerConnection,
  kind: Brief['kind'],
  since: number,
): Promise<string> {
  await gathered(pc, since);
  const data = brief(kind, pc.localDescription?.sdp ?? '');
  log(`${kind === 'offer' ? 'oferta' : 'respuesta'}: ${data.candidates.length} candidatos`);
  for (const candidate of data.candidates) log(`  propio: ${addressKind(candidate)}`);
  const text = encode(data);
  log(`QR de ${text.length} caracteres`);
  return text;
}

const percentile = (values: number[], p: number) =>
  values.slice().sort((a, b) => a - b)[Math.min(values.length - 1, Math.floor(values.length * p))];

// Ya abierto: cuánto tarda un mensaje en ir y volver, y por qué par de candidatos va.
async function measure(pc: RTCPeerConnection, channel: RTCDataChannel): Promise<void> {
  const times: number[] = [];
  for (let i = 0; i < 100; i++) {
    const sent = performance.now();
    await new Promise<void>((resolve) => {
      channel.onmessage = () => resolve();
      channel.send(`ping ${i}`);
    });
    times.push(performance.now() - sent);
  }
  const round = (value: number) => value.toFixed(1);
  log(
    `ida y vuelta de 100 mensajes: p50 ${round(percentile(times, 0.5))} ms, ` +
      `p95 ${round(percentile(times, 0.95))} ms, máximo ${round(Math.max(...times))} ms`,
  );
  const stats = await pc.getStats();
  stats.forEach((entry) => {
    if (entry.type !== 'candidate-pair' || !entry.nominated) return;
    const local = stats.get(entry.localCandidateId);
    const remote = stats.get(entry.remoteCandidateId);
    log(
      `par elegido: propio ${local?.candidateType} ${local?.protocol}, ` +
        `del otro ${remote?.candidateType} ${remote?.protocol}, ` +
        `RTT ${entry.currentRoundTripTime === undefined ? '?' : round(entry.currentRoundTripTime * 1000)} ms`,
    );
  });
  finish(true);
}

function watch(pc: RTCPeerConnection, channel: RTCDataChannel, answering: boolean): void {
  let opened = false;
  pc.addEventListener('iceconnectionstatechange', () => log(`ICE: ${pc.iceConnectionState}`));
  channel.onopen = () => {
    opened = true;
    log('CANAL DE DATOS ABIERTO');
    // El que respondió devuelve cada mensaje; el que ofreció mide.
    if (answering) channel.onmessage = (event) => channel.send(event.data);
    else void measure(pc, channel);
  };
  setTimeout(() => {
    if (!opened) {
      log('el canal no abrió en 15 s: la red no deja la conexión directa');
      finish(false);
    }
  }, 15_000);
}

function finish(ok: boolean): void {
  const summary = [
    `Resultado: ${ok ? 'ANDUVO' : 'NO ANDUVO'}`,
    `Dispositivo: ${navigator.userAgent}`,
    `Cámara usada en esta pestaña: ${cameraUsed ? 'sí' : 'no'}`,
  ];
  $('result').textContent = summary[0] as string;
  $('result').className = ok ? 'ok' : 'bad';
  report.unshift(...summary, '');
  $('log').textContent = report.join('\n');
}

async function asComputer(): Promise<void> {
  log('rol: computadora (ofrece)');
  const pc = new RTCPeerConnection({ iceServers: [] });
  const channel = pc.createDataChannel('mirror', { ordered: true });
  watch(pc, channel, false);
  const since = performance.now();
  await pc.setLocalDescription(await pc.createOffer());
  showQr(await localBrief(pc, 'offer', since));
  $('step').textContent =
    'Leé este código con el celular. Después, leé con esta computadora el que muestra el celular.';
  const onAnswer = async (data: Brief) => {
    log('respuesta leída');
    await pc.setRemoteDescription(rebuild(data));
  };
  $('read').hidden = false;
  $('read').onclick = () => void scan('answer', onAnswer);
  paste('answer', onAnswer);
}

async function asPhone(): Promise<void> {
  log('rol: celular (responde)');
  const pc = new RTCPeerConnection({ iceServers: [] });
  pc.ondatachannel = (event) => watch(pc, event.channel, true);
  const onOffer = async (data: Brief) => {
    log('oferta leída');
    await pc.setRemoteDescription(rebuild(data));
    const since = performance.now();
    await pc.setLocalDescription(await pc.createAnswer());
    showQr(await localBrief(pc, 'answer', since));
    $('step').textContent = 'Leé este código con la computadora.';
  };
  $('step').textContent = 'Leé el código que muestra la computadora.';
  $('read').hidden = false;
  $('read').onclick = () => void scan('offer', onOffer);
  paste('offer', onOffer);
}

$('computer').onclick = () => {
  $('roles').hidden = true;
  void asComputer();
};
$('phone').onclick = () => {
  $('roles').hidden = true;
  void asPhone();
};
$('copy').onclick = () => void navigator.clipboard.writeText(report.join('\n'));
$('copy-own').onclick = () =>
  void navigator.clipboard.writeText($<HTMLTextAreaElement>('own').value);
