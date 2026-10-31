// El comando del primer Administrador (02 · R1.2; diseño de 02, § 7): carga a la primera persona de
// una instalación, solo si no hay ninguna. Toma del ambiente solo DATABASE_URL: el correo nunca sale
// de la configuración. Queda fuera de la cobertura, como main.ts: lo que hace se prueba en
// modules/users/first.ts.
//   docker compose exec server node src/server/first-administrator.ts <correo> [nombre]
import { addFirstAdministrator } from './modules/users/first.ts';
import { createUsersModule } from './modules/users/index.ts';
import { systemClock } from './platform/clock.ts';
import { migrate, openDatabase } from './platform/storage/db.ts';

const [email, ...name] = process.argv.slice(2);
const url = process.env.DATABASE_URL;
if (!email?.includes('@') || !url) {
  console.error('Uso: DATABASE_URL=… node src/server/first-administrator.ts <correo> [nombre]');
  process.exit(1);
}
const db = await openDatabase<unknown>(url);
const { module } = createUsersModule({ accessCounts: async () => new Map() });
await migrate(db, module.schema ? [module.schema] : []);
const added = await addFirstAdministrator(db, systemClock, email, name.join(' ') || undefined);
await db.destroy();
console.log(
  added
    ? `Listo: ${email} es el primer Administrador.`
    : 'Ya hay personas cargadas: no se cargó a nadie.',
);
process.exitCode = added ? 0 : 2;
