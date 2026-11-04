// Lo que escucha el vínculo de otros módulos, sin que ellos lo conozcan (diseño de 03, § 11.1): una
// tabla, una fila por aviso, con qué vínculos toca y por qué. Lo escrito va en la transacción de
// quien avisó; la memoria, las claves del canal y la auditoría, después de confirmarla.
import type { ServerEvents } from '../../platform/events.ts';
import type { DeviceLinkContext } from './context.ts';
import type { DeviceLinkData } from './data.ts';
import { afterEnding, afterPairing, pair, recordEnded } from './lifecycle.ts';
import type { EndReason, Pairing } from './rules.ts';

type Ending<K extends keyof ServerEvents> = {
  event: K;
  // Los vínculos que termina ese aviso, dentro de la transacción.
  find: (data: DeviceLinkData, payload: ServerEvents[K]) => Promise<Pairing[]>;
  reason: (payload: ServerEvents[K]) => EndReason;
};

// Salir o que la sesión venza no terminan el vínculo: queda dormido (R2.1, E17).
const endings = [
  {
    event: 'sessions.revoked',
    find: (data, { userId, deviceIds }) => data.forDevices(userId, deviceIds),
    reason: () => 'session-revoked',
  } satisfies Ending<'sessions.revoked'>,
  {
    event: 'passkey.removed',
    find: (data, { userId, deviceId }) => data.forDevices(userId, [deviceId]),
    reason: ({ cause }) => (cause === 'cut' ? 'phone-cut' : 'passkey-removed'),
  } satisfies Ending<'passkey.removed'>,
  {
    event: 'user.deactivated',
    find: (data, { userId }) => data.forUser(userId),
    reason: () => 'deactivated',
  } satisfies Ending<'user.deactivated'>,
];

function listenToEnding<K extends keyof ServerEvents>(ctx: DeviceLinkContext, ending: Ending<K>) {
  ctx.platform.events.on(ending.event, async (payload, trx) => {
    const data = ctx.dataIn(trx);
    const found = await ending.find(data, payload);
    const ended = await data.remove(found.map((pairing) => pairing.id));
    return () => {
      afterEnding(ctx, ended);
      recordEnded(ctx, ended, ending.reason(payload));
    };
  });
}

export function listenToOthers(ctx: DeviceLinkContext): void {
  for (const ending of endings) listenToEnding(ctx, ending as Ending<keyof ServerEvents>);
  // Entrar a la computadora con el celular los vincula, reemplazando sin preguntar (R1.5).
  ctx.platform.events.on('sign-in.phone-approved', async (approved, trx) => {
    const { userId } = approved;
    const phone = {
      userId,
      deviceId: approved.phoneDeviceId,
      label: approved.phoneLabel,
      isPhone: true,
    };
    const computer = {
      userId,
      deviceId: approved.computerDeviceId,
      label: approved.computerLabel,
      isPhone: false,
    };
    const paired = await pair(
      ctx.dataIn(trx),
      phone,
      computer,
      'sign-in',
      ctx.platform.clock.now(),
    );
    return () => afterPairing(ctx, paired, { kind: 'person', userId });
  });
}
