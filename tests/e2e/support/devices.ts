// Los dispositivos de las pruebas de punta a punta: la computadora y el celular, cada uno con su
// propio contexto del navegador, y la huella del celular con el autenticador virtual de Chromium.
import type { Browser, Page } from '@playwright/test';

const origin = () => String(process.env.E2E_ORIGIN);

// `userAgent`: para distinguir una computadora de otra por su nombre («Firefox en Linux»).
export async function computer(browser: Browser, userAgent?: string): Promise<Page> {
  const context = await browser.newContext({
    baseURL: origin(),
    viewport: { width: 1366, height: 768 },
    reducedMotion: 'reduce',
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
