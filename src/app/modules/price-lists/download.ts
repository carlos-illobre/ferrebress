// Bajar el archivo original de una lista (08 · R4.4, E40), con su nombre: desde Archivos de listas, desde
// ver qué cambia y desde las listas de un proveedor (R6.7). Si ya no se guarda o hay dos bajando, se dice.
import { notify } from '../../platform/view/notify.ts';
import { saveFile } from '../../platform/view/save-file.ts';
import { filesTexts as texts } from './admin/texts-files.ts';
import { filesApi } from './api.ts';

const errors: Record<string, string> = {
  'file-gone': texts.fileGone,
  'too-many-downloads': texts.tooMany,
};

export async function downloadList(listId: string, fileName: string) {
  const result = await filesApi.download(listId, fileName);
  if (result.ok) return saveFile(result.data.blob, result.data.name);
  notify(errors[result.error] ?? texts.downloadFailed, 'triangle-alert');
}
