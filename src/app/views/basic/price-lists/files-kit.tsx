// Lo que comparten las pruebas de Archivos de listas (06 · pantalla 3): los archivos como los trae el
// servidor y la pantalla montada con un servidor de mentira.
import type { FilesPage, ListFileView } from '@ferrebress/shared/contracts/price-lists';
import type { Reply } from '../../../testing/fake-server.ts';
import { mountScreen, type Who } from '../screen-kit.tsx';
import { Files } from './Files.tsx';
import { admin, now } from './readers-kit.tsx';

export const sha = (n: number) => String(n).repeat(64).slice(0, 64);
export const MB = 2 ** 20;

export const file = (n: number, more: Partial<ListFileView> = {}): ListFileView => ({
  sha256: sha(n),
  size: 3 * MB,
  // Dos horas antes de la hora que dice el servidor de mentira.
  storedAt: new Date(1_700_000_000_000 - 2 * 3_600_000).toISOString(),
  deleting: false,
  lists: [{ id: `l${n}`, fileName: `lista-${n}.xlsx`, status: 'applied', supplier: 'Bulonera' }],
  ...more,
});

export const page: FilesPage = {
  files: [
    file(1),
    file(2, {
      size: 400_000,
      lists: [{ id: 'l2', fileName: 'nueva.csv', status: 'reading' }],
    }),
  ],
  totalBytes: 80 * MB,
  limitBytes: 100 * MB,
};

export const filesPath = '/api/price-lists/files';
export const removeOf = (n: number) => `${filesPath}/${sha(n)}/delete`;
export const restoreOf = (n: number) => `${filesPath}/${sha(n)}/restore`;
export const fileOf = (list: string) => `/api/price-lists/lists/${list}/file`;

export const costsOnly = {
  ...admin,
  userId: 'ana',
  roles: [{ id: 'c', name: 'Costos' }],
  permissions: ['price-lists.costs' as const],
};
export const seller = { ...costsOnly, permissions: ['users.view' as const] };

export const openFiles = (routes: Record<string, Reply | Reply[]> = {}, who: Who = admin) =>
  mountScreen(Files, { routes: { [filesPath]: { body: page }, ...routes }, who, now: now });

// Cuándo se subió y cuánto ocupa, del primero.
export const meta = () => document.querySelector('.files-meta')?.textContent;
