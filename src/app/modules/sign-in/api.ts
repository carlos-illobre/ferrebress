// Las llamadas al servidor del módulo, una sola vez (diseño de 01, § 4). Las huellas van y vienen en
// el JSON de WebAuthn: el servidor arma las opciones y valida las respuestas.

import type { OfflineSignInBody } from '@ferrebress/shared/contracts/offline-sign-in';
import type {
  ApproveCodeBody,
  LinkPasskeyResponse,
  NonceResponse,
  ReadCodeResponse,
  SignInResponse,
  StartResponse,
} from '@ferrebress/shared/contracts/sign-in';
import { tabId } from '../../platform/device/device.ts';
import { api } from '../../platform/server/api.ts';

type Ok = { ok: true };
type Json = Record<string, unknown>;

export type ApproveBody = ApproveCodeBody;

export const signInApi = {
  start: () => api<StartResponse>('/api/start'),
  nonce: () => api<NonceResponse>('/api/sign-in/google/nonce'),
  google: (credential: string, proofPublicKey: string) =>
    api<SignInResponse>('/api/sign-in/google', { credential, proofPublicKey }),
  passkeyOptions: () => api<Json>('/api/sign-in/passkey/options', {}),
  passkey: (response: Json, proofPublicKey: string) =>
    api<SignInResponse>('/api/sign-in/passkey', { response, proofPublicKey }),
  linkOptions: () => api<Json>('/api/passkeys/options', {}),
  link: (response: Json) => api<LinkPasskeyResponse>('/api/passkeys', { response }),
  // La pestaña va para que recargarla reemplace su pantalla (01 · R2.5).
  openScreen: () => api<Ok>('/api/sign-in/codes', { tab: tabId() }),
  readCode: (code: string) => api<ReadCodeResponse>('/api/sign-in/codes/read', { code }),
  approve: (body: ApproveBody) => api<Ok>('/api/sign-in/codes/approve', body),
  cancel: (secret: string) => api<Ok>('/api/sign-in/codes/cancel', { secret }),
  claim: (permit: string, proofPublicKey: string) =>
    api<SignInResponse>('/api/sign-in/codes/claim', { permit, proofPublicKey }),
  // Volver a confirmar quién es, sin salir (02 · R3.8).
  confirmGoogle: (credential: string) => api<Ok>('/api/session/confirm/google', { credential }),
  confirmPasskeyOptions: () => api<Json>('/api/session/confirm/passkey/options', {}),
  confirmPasskey: (response: Json) => api<Ok>('/api/session/confirm/passkey', { response }),
  // Confirmar una entrada sin conexión (15 · R3).
  offline: (entry: Omit<OfflineSignInBody, 'response'> & { response: Json }) =>
    api<SignInResponse | { ended: true }>('/api/sign-in/offline', entry),
  signOut: (pending?: { sessionId: string; signature: string; tappedAt: number }) =>
    api<Ok>('/api/sign-out', pending ? { pending } : {}),
};
