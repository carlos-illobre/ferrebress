// Quién hizo qué (capítulo 05, diseño de 05): le da a la auditoría el color de cada acción, que
// sabe el catálogo, y registra sus rutas, que leen en un hilo aparte.
import { toneOf } from '@ferrebress/shared/audit-log/index';
import type { ServerModule } from '../../platform/modules.ts';
import { openAuditReader } from '../../platform/storage/audit/reader.ts';
import { registerAuditLogRoutes } from './routes.ts';

export function createAuditLogModule(): ServerModule {
  return {
    name: 'audit-log',
    register(platform) {
      platform.audit.provideTone((event) =>
        toneOf(event.type, {
          actor: event.actor.kind === 'person' ? event.actor : { kind: event.actor.kind },
          ...(event.targets && { targets: event.targets }),
          ...(event.changes && { changes: event.changes }),
          ...(event.data && { data: event.data }),
        }),
      );
      const reader = openAuditReader(platform.config.AUDIT_PATH, platform.audit);
      platform.onClose(() => reader.close());
      registerAuditLogRoutes(platform, reader);
    },
  };
}
