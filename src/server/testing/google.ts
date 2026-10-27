// Un emisor de Google de prueba (diseño de 01, § 12): sus llaves se generan en cada corrida y no
// se guardan. Firma pases como los de Google, con lo que cada prueba quiera cambiar.
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';

export async function createTestGoogle(clientId: string, issuer = 'https://accounts.google.com') {
  const { privateKey, publicKey } = await generateKeyPair('RS256');
  const jwk = { ...(await exportJWK(publicKey)), kid: 'test', alg: 'RS256' };
  return {
    keys: createLocalJWKSet({ keys: [jwk] }),
    credential(
      claims: Record<string, unknown>,
      options: { expiresIn?: string; audience?: string } = {},
    ) {
      return new SignJWT({ email_verified: true, name: 'Ana Gómez', ...claims })
        .setProtectedHeader({ alg: 'RS256', kid: 'test' })
        .setIssuer(issuer)
        .setAudience(options.audience ?? clientId)
        .setIssuedAt()
        .setExpirationTime(options.expiresIn ?? '5m')
        .sign(privateKey);
    },
  };
}
