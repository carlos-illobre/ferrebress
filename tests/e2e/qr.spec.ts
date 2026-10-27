// 3 · Entrar a la computadora con el QR, con dos navegadores (R2.5 a R2.7; E13, E16): la computadora
// muestra el código, el celular con la huella lo lee y la computadora entra sola. La prueba lee el
// código del canal en tiempo real, que es lo mismo que dibuja el QR, en lugar de fotografiarlo.
import { expect, test } from '@playwright/test';
import { computer, phone } from './support/devices.ts';
import { signInWithGoogle } from './support/google.ts';

type WithCodes = { e2eCodes: string[] };

test('el celular lee el QR, pone la huella y la computadora entra', async ({ browser }) => {
  const desk = await computer(browser);
  await desk.addInitScript(() => {
    const codes: string[] = [];
    (window as unknown as WithCodes).e2eCodes = codes;
    const original = window.fetch;
    window.fetch = async (...args) => {
      const response = await original(...args);
      if (!String(args[0]).includes('/api/realtime/sign-in-codes') || !response.body)
        return response;
      const [mine, theirs] = response.body.tee();
      void (async () => {
        const reader = mine.pipeThrough(new TextDecoderStream()).getReader();
        for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read())
          for (const found of chunk.value.matchAll(/"code":"([^"]+)"/g))
            codes.push(found[1] as string);
      })();
      return new Response(theirs, response);
    };
  });
  await desk.goto('/');
  const hand = await phone(browser);
  await hand.goto('/');
  await signInWithGoogle(hand);
  await hand.getByRole('button', { name: 'Sí, usar la huella' }).click();
  await expect(hand.getByRole('dialog')).toHaveCount(0);
  await expect
    .poll(() => desk.evaluate(() => (window as unknown as WithCodes).e2eCodes.length))
    .toBeGreaterThan(0);
  const code = await desk.evaluate(() => (window as unknown as WithCodes).e2eCodes.at(-1));
  await hand.goto(`/link#${code}`);
  await hand.getByRole('button', { name: 'Sí, entrar con la huella' }).click();
  await expect(desk.getByRole('region', { name: 'Tu sesión' })).toBeVisible();
});
