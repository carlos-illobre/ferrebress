import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  findStaleTableTypes,
  generateTableTypes,
  tableTypesPath,
  writeTableTypes,
} from './table-types.ts';

const repository = new URL('../..', import.meta.url).pathname;

describe('los tipos de las tablas (ADR-018)', () => {
  it('genera un archivo por módulo con esquema, solo con sus tablas y sin las de migraciones', async () => {
    const files = await generateTableTypes();
    expect([...files.keys()].sort()).toEqual(
      ['device-link', 'sign-in', 'users'].map(tableTypesPath),
    );
    const users = files.get(tableTypesPath('users')) ?? '';
    expect(users).toMatch(/^\/\/ Las tablas del esquema `users`/);
    expect(users).toContain('"users.roles": UsersRoles;');
    expect(users).not.toContain('sign_in.');
    expect(users).not.toContain('kysely_migration');
  });

  it('declara lo que la base no sabe y lee bytea como Uint8Array', async () => {
    const files = await generateTableTypes();
    expect(files.get(tableTypesPath('device-link'))).toContain('paired_by: "button" | "sign-in";');
    expect(files.get(tableTypesPath('sign-in'))).toContain('token_hash: Uint8Array;');
  });

  it('los del repositorio están al día con las migraciones', async () => {
    expect(await findStaleTableTypes(repository)).toEqual([]);
  });

  it('avisa los que faltan o no coinciden, y escribirlos los pone al día', async () => {
    const root = mkdtempSync(join(tmpdir(), 'ferrebress-table-types-'));
    expect(await findStaleTableTypes(root)).toHaveLength(3);
    await writeTableTypes(root);
    expect(await findStaleTableTypes(root)).toEqual([]);
    const path = join(root, tableTypesPath('users'));
    writeFileSync(path, `${readFileSync(path, 'utf8')}// a mano\n`);
    expect(await findStaleTableTypes(root)).toEqual([
      `${tableTypesPath('users')}: no coincide con las migraciones; corré pnpm db:types`,
    ]);
  });
});
