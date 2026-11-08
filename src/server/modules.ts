// Arma los módulos del servidor y los conecta entre sí (diseño de 02, § 3): personas recibe de entrar
// cuántas sesiones y celulares tiene cada una, y entrar recibe la fachada de personas. Quién hizo qué
// no depende de nadie: lee la auditoría. Lo usan
// main.ts y las pruebas, así lo que conecta se prueba.
import type { JWTVerifyGetKey } from 'jose';
import {
  createAdministrationModule,
  type PriceRecalculator,
} from './modules/administration/index.ts';
import { createAuditLogModule } from './modules/audit-log/index.ts';
import { createDeviceLinkModule } from './modules/device-link/index.ts';
import { createSignInModule } from './modules/sign-in/index.ts';
import { createUsersModule } from './modules/users/index.ts';
import { sleep } from './platform/clock.ts';

export type ModulesOptions = {
  // Las llaves de Google y cómo esperar el próximo código: las pruebas pasan las suyas.
  googleKeys?: JWTVerifyGetKey;
  wait?: (ms: number) => Promise<void>;
  // Quien recalcula los precios al cambiar el redondeo: hasta el catálogo, las pruebas pasan el suyo.
  recalculator?: PriceRecalculator;
};

export function createModules(options: ModulesOptions = {}) {
  const users = createUsersModule({
    accessCounts: (userIds, asking) => signIn.accessCounts(userIds, asking),
  });
  const admin = createAdministrationModule({
    nameOf: (id) => users.users.nameOf(id),
    ...(options.recalculator && { recalculator: options.recalculator }),
  });
  const signIn = createSignInModule({ users: users.users, ...options });
  // El vínculo espera con el mismo reloj que la entrada (sus códigos del QR se renuevan igual).
  const deviceLink = createDeviceLinkModule({ wait: options.wait ?? sleep });
  const modules = [admin.module, users.module, signIn, createAuditLogModule(), deviceLink];
  return {
    modules,
    users: users.users,
    people: users.people,
    administration: admin.administration,
  };
}
