// Los temas del vínculo en el canal común (diseño de 03, § 3.1): el código del QR de la computadora
// (`device-link.code`) y el vínculo de cada lado (`device-link.pairing`), por el que cada uno se
// entera si el otro está, se presentan y pasan los mensajes de respaldo. Escuchar un vínculo pide
// ser de ese vínculo y de ese lado (E38); la clave separa los dos lados.
import { randomBytes } from 'node:crypto';
import type { Side } from '@ferrebress/shared/contracts/device-link';
import * as z from 'zod/mini';
import type { RequestSession } from '../../platform/session.ts';
import type { DeviceLinkContext } from './context.ts';
import { keyOf, pairingTopic } from './lifecycle.ts';
import { deviceOf, otherSide, sideOf } from './rules.ts';

export const codeTopic = 'device-link.code';

const json = z.unknown();
const pairingEvent = z.union([
  z.strictObject({ present: z.boolean(), attempt: z.optional(z.string()) }),
  z.strictObject({ signal: json }),
  z.strictObject({ relay: z.array(json) }),
  z.strictObject({ pairing: json }),
]);

const sideFromKey = (key: string) => key.slice(key.lastIndexOf(':') + 1) as Side;
const idFromKey = (key: string) => key.slice(0, key.lastIndexOf(':'));

// Un intento de presentarse: el mismo en los dos lados y en el registro (§ 4.4, § 15).
const newAttempt = () => randomBytes(4).toString('hex');

// El código del QR (R1.3): solo una computadora con sesión, uno nuevo cada 60 s mientras lo escucha.
function defineCodeTopic(ctx: DeviceLinkContext): void {
  const { realtime } = ctx.platform;
  realtime.topic({
    name: codeTopic,
    param: z.string().check(z.maxLength(0)),
    event: z.union([z.strictObject({ code: z.string() }), z.strictObject({ paired: json })]),
    authorize: ({ session }) => {
      if (!session || session.isPhone) return { refused: 'bad-request' };
      const { userId, deviceId, deviceLabel: label, isPhone } = session;
      ctx.computers.set(session.id, { userId, deviceId, label, isPhone });
      return { key: session.id };
    },
    onSubscribe: (key, send) => ctx.codes.start(key, (code) => send({ code })),
    onUnsubscribe: (key) => {
      if (realtime.listeners(codeTopic, key) > 0) return;
      ctx.codes.stop(key);
      ctx.computers.delete(key);
    },
  });
}

// El vínculo, de un lado: si el otro está; cuando están los dos, el intento de presentarse.
function definePairingTopic(ctx: DeviceLinkContext): void {
  const { realtime } = ctx.platform;
  realtime.topic({
    name: pairingTopic,
    param: z.string().check(z.length(36)),
    event: pairingEvent,
    // Un tema con sesión: el canal no lo deja escuchar sin ella.
    authorize: async (listener, pairingId) => {
      const session = listener.session as RequestSession;
      const pairing = await ctx.members.pairingOf(session.userId, session.deviceId);
      const side = sideOf(session);
      if (pairing?.id !== pairingId || deviceOf(pairing, side) !== session.deviceId)
        return { refused: 'not-paired' };
      ctx.members.useSession(pairing.id, side, session.id);
      return { key: keyOf(pairing.id, side) };
    },
    onSubscribe: (key, send) => {
      const other = keyOf(idFromKey(key), otherSide(sideFromKey(key)));
      if (realtime.listeners(pairingTopic, other) === 0) return send({ present: false });
      const attempt = newAttempt();
      send({ present: true, attempt });
      realtime.publish(pairingTopic, other, { present: true, attempt });
    },
    onUnsubscribe: (key) => {
      if (realtime.listeners(pairingTopic, key) > 0) return;
      const other = keyOf(idFromKey(key), otherSide(sideFromKey(key)));
      realtime.publish(pairingTopic, other, { present: false });
    },
  });
}

export function defineTopics(ctx: DeviceLinkContext): void {
  defineCodeTopic(ctx);
  definePairingTopic(ctx);
}
