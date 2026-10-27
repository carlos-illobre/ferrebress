// Entrar con Google en las pruebas de punta a punta: el pase lo firma el emisor de prueba con el
// nonce que la entrada le dio al botón, y se lo pasa al botón en su marco, como hace Google.
import { expect, type Frame, type Page } from '@playwright/test';
import { importJWK, SignJWT } from 'jose';
import { adminEmail, clientId } from '../stack/start.ts';

type E2eGoogle = { nonce: string; forgot: boolean; signIn: (credential: string) => void };
type WithGoogle = { e2eGoogle?: E2eGoogle };

async function credential(nonce: string, email = adminEmail): Promise<string> {
  const key = await importJWK(JSON.parse(String(process.env.E2E_GOOGLE_KEY)), 'RS256');
  return new SignJWT({ email, email_verified: true, name: 'Ana Gómez', nonce })
    .setProtectedHeader({ alg: 'RS256', kid: 'e2e' })
    .setIssuer(String(process.env.E2E_GOOGLE_ISSUER))
    .setAudience(clientId)
    .setSubject(`e2e-${email}`)
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(key);
}

// El marco del botón, ya dibujado (la entrada lo muestra recién entonces).
export async function googleButton(page: Page): Promise<Frame> {
  const place = page.locator('.google[data-drawn] iframe');
  await expect(place).toBeVisible();
  return (await (await place.elementHandle())?.contentFrame()) as Frame;
}

export const googleState = (frame: Frame) =>
  frame.evaluate(() => {
    const google = (window as WithGoogle).e2eGoogle as E2eGoogle;
    return { nonce: google.nonce, forgot: google.forgot };
  });

export async function signInWithGoogle(page: Page): Promise<void> {
  const frame = await googleButton(page);
  const { nonce } = await googleState(frame);
  const pass = await credential(nonce);
  await frame.evaluate((pass) => (window as WithGoogle).e2eGoogle?.signIn(pass), pass);
}
