// «Actualizar solo» en el servidor (05 · R4.6; diseño de 05, § 7.1): el tema `audit-log.new` del
// canal común, que avisa sin datos que se anotó algo, como mucho una vez cada 5 s. Lo escuchan solo
// quienes pueden ver Quién hizo qué; si les sacan el permiso, el canal los suelta.
import { auditLiveTopic } from '@ferrebress/shared/contracts/audit-log';
import * as z from 'zod/mini';
import type { Platform } from '../../platform/modules.ts';
import type { Listener } from '../../platform/realtime/topics.ts';
import type { RequestSession } from '../../platform/session.ts';
import { auditLogSettings } from './settings.ts';

const everyone = 'all';
const permission = 'audit-log.view';

// Como mucho un aviso cada `everyMs`: el primero en el momento, los que llegan antes se juntan en uno
// al final. Sin nadie que escuche, nada.
export function createNotifier(
  publish: () => void,
  listening: () => boolean,
  everyMs: number = auditLogSettings.live.everyMs,
) {
  let last = Number.NEGATIVE_INFINITY;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const send = () => {
    last = Date.now();
    publish();
  };
  return () => {
    if (timer || !listening()) return;
    const wait = last + everyMs - Date.now();
    if (wait <= 0) return send();
    timer = setTimeout(() => {
      timer = undefined;
      if (listening()) send();
    }, wait);
    timer.unref?.();
  };
}

// Quien pide el tema sin el permiso, al abrir o al sumarlo, queda anotado como en las rutas; al
// volver a mirar los permisos (sin pedido) no.
function refuse(platform: Platform, { session, request }: Listener) {
  const { limiter, audit, clock } = platform;
  const { userId } = session as RequestSession;
  const key = `audit:permission.denied:${userId}:${permission}`;
  if (request && limiter.hit(key, auditLogSettings.deniedAudit).allowed)
    audit.record({
      type: 'permission.denied',
      at: clock.now(),
      actor: { kind: 'person', userId },
      ipAddress: request.get('ipAddress') as string,
      data: { permission, topic: auditLiveTopic },
    });
  return { refused: 'forbidden' as const };
}

export function registerLive(platform: Platform): void {
  const { realtime, permissions, audit } = platform;
  realtime.topic({
    name: auditLiveTopic,
    param: z.string().check(z.maxLength(0)),
    event: z.strictObject({}),
    authorize: async (listener) => {
      // Un tema con sesión: el canal no lo deja escuchar sin ella.
      const { userId } = listener.session as RequestSession;
      const granted = await permissions.of(userId);
      return granted.includes(permission) ? { key: everyone } : refuse(platform, listener);
    },
    // Al empezar a escuchar, la pantalla se pone al día una vez (prenderlo, volver a la vista).
    onSubscribe: (_key, send) => send({}),
    recheckOn: ['users.permissions-changed'],
  });
  const notify = createNotifier(
    () => void realtime.publish(auditLiveTopic, everyone, {}),
    () => realtime.listeners(auditLiveTopic, everyone) > 0,
  );
  audit.onWritten(notify);
}
