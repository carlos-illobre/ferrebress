// El primer Administrador de una instalación (02 · R1.2): se carga una sola vez, solo si no hay
// ninguna persona. Lo usan el comando de la instalación y, en las pruebas de punta a punta, el
// arranque; nunca una ruta de la API.
import type { Kysely } from 'kysely';
import type { Clock } from '../../platform/clock.ts';
import { newId } from '../../platform/ids.ts';
import { type UsersTables, usersData } from './data.ts';
import { cleanName, normalizeEmail } from './rules.ts';

export const addFirstAdministrator = (
  db: Kysely<unknown>,
  clock: Clock,
  email: string,
  name?: string,
): Promise<boolean> =>
  usersData(db as Kysely<UsersTables>).addFirst(
    newId(clock),
    normalizeEmail(email),
    cleanName(name),
  );
