// Arma los módulos del servidor y los conecta entre sí (diseño de 02, § 3): personas recibe de entrar
// cuántas sesiones y celulares tiene cada una, y entrar recibe la fachada de personas. Lo usan
// main.ts y las pruebas, así lo que conecta se prueba.
import type { JWTVerifyGetKey } from 'jose';
import { createSignInModule } from './modules/sign-in/index.ts';
import { createUsersModule } from './modules/users/index.ts';

export type ModulesOptions = {
  // Las llaves de Google y cómo esperar el próximo código: las pruebas pasan las suyas.
  googleKeys?: JWTVerifyGetKey;
  wait?: (ms: number) => Promise<void>;
};

export function createModules(options: ModulesOptions = {}) {
  const users = createUsersModule({
    accessCounts: (userIds, asking) => signIn.accessCounts(userIds, asking),
  });
  const signIn = createSignInModule({ users: users.users, ...options });
  return { modules: [users.module, signIn], users: users.users, people: users.people };
}
