// Las llamadas al servidor del módulo, una sola vez (diseño de 01, § 4). Las huellas van y vienen en
// el JSON de WebAuthn: el servidor arma las opciones y valida las respuestas.
import type {
  ApproveCodeBody,
  ReadCodeResponse,
  SignInResponse,
  StartResponse,
} from '@ferrebress/shared/contracts/sign-in';
import { api } from '../../platform/server/api.ts';

type Ok = { ok: true };
type Json = Record<string, unknown>;

export type ApproveBody = ApproveCodeBody;

export const signInApi = {
  start: () => api<StartResponse>('/api/start'),
  google: (credential: string, proofPublicKey: string) =>
    api<SignInResponse>('/api/sign-in/google', { credential, proofPublicKey }),
  passkeyOptions: () => api<Json>('/api/sign-in/passkey/options', {}),
  passkey: (response: Json, proofPublicKey: string) =>
    api<SignInResponse>('/api/sign-in/passkey', { response, proofPublicKey }),
  linkOptions: () => api<Json>('/api/passkeys/options', {}),
  link: (response: Json) => api<Ok>('/api/passkeys', { response }),
  openScreen: () => api<Ok>('/api/sign-in/codes', {}),
  readCode: (code: string) => api<ReadCodeResponse>('/api/sign-in/codes/read', { code }),
  approve: (body: ApproveBody) => api<Ok>('/api/sign-in/codes/approve', body),
  cancel: (secret: string) => api<Ok>('/api/sign-in/codes/cancel', { secret }),
  claim: (permit: string, proofPublicKey: string) =>
    api<SignInResponse>('/api/sign-in/codes/claim', { permit, proofPublicKey }),
  signOut: (pending?: { sessionId: string; signature: string; tappedAt: number }) =>
    api<Ok>('/api/sign-out', pending ? { pending } : {}),
};
