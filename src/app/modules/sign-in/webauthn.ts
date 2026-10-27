// La huella con WebAuthn: las opciones llegan del servidor en JSON y la respuesta vuelve en JSON,
// con lo que los navegadores ya traen (parse…FromJSON y toJSON), sin bibliotecas. Si la persona
// cancela o el celular no puede, devuelve undefined: la pantalla sigue como estaba.
type Json = Record<string, unknown>;

const asJson = (credential: Credential | null) =>
  credential ? ((credential as PublicKeyCredential).toJSON() as unknown as Json) : undefined;

export async function createPasskey(options: Json): Promise<Json | undefined> {
  try {
    const publicKey = PublicKeyCredential.parseCreationOptionsFromJSON(
      options as unknown as PublicKeyCredentialCreationOptionsJSON,
    );
    return asJson(await navigator.credentials.create({ publicKey }));
  } catch {
    return undefined;
  }
}

export async function signWithPasskey(options: Json): Promise<Json | undefined> {
  try {
    const publicKey = PublicKeyCredential.parseRequestOptionsFromJSON(
      options as unknown as PublicKeyCredentialRequestOptionsJSON,
    );
    return asJson(await navigator.credentials.get({ publicKey }));
  } catch {
    return undefined;
  }
}
