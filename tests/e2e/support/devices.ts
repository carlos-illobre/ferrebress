// Los dispositivos de las pruebas de punta a punta: la computadora y el celular, cada uno con su
// propio contexto del navegador, y la huella del celular con el autenticador virtual de Chromium.
import type { Browser, Page } from '@playwright/test';

const origin = () => String(process.env.E2E_ORIGIN);

// Cada dispositivo llega desde su propia dirección, como en producción: el navegador le habla a
// Caddy desde la máquina, que es de confianza, y Caddy toma la de X-Forwarded-For como la real (la
// que agrega el proxy de la máquina). Si todos fueran 127.0.0.1, la suite entera compartiría los
// límites por dirección (30 /api/start por minuto) y las últimas pruebas recibirían 429. Una de
// documentación de IPv6, que no es privada (Caddy saltearía una privada) y no se repite entre
// workers.
let devices = 0;
const address = () =>
  `2001:db8::${Number(process.env.TEST_WORKER_INDEX ?? 0).toString(16)}:${(++devices).toString(16)}`;
const from = () => ({ extraHTTPHeaders: { 'X-Forwarded-For': address() } });

// `userAgent`: para distinguir una computadora de otra por su nombre («Firefox en Linux»).
export async function computer(browser: Browser, userAgent?: string): Promise<Page> {
  const context = await browser.newContext({
    baseURL: origin(),
    viewport: { width: 1366, height: 768 },
    reducedMotion: 'reduce',
    ...from(),
    ...(userAgent && { userAgent }),
  });
  return context.newPage();
}

export async function phone(browser: Browser): Promise<Page> {
  const context = await browser.newContext({
    baseURL: origin(),
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/141 Mobile',
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
    ...from(),
  });
  // Chromium no cambia navigator.userAgentData con la emulación: se lo dice como un celular.
  await context.addInitScript(() =>
    Object.defineProperty(navigator, 'userAgentData', {
      get: () => ({ mobile: true, platform: 'Android' }),
    }),
  );
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
  return page;
}
