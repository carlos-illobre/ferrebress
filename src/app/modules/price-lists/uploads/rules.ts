// Lo que se dice y se pregunta de cada lista que se sube (08 · pantalla 2), resuelto para cualquier
// vista: si el archivo se acepta antes de subirlo (R4.2), en qué va (R4.9), de quién es (R4.3) y qué
// queda por hacer. Sin pedidos.
import {
  type ListProgress,
  type ListScope,
  type ListState,
  listExtensions,
  type SupplierRow,
} from '@ferrebress/shared/contracts/price-lists';
import { listReasonTexts } from '../texts-status.ts';
import { uploadsTexts as texts } from './texts.ts';

export type Phase = 'sending' | 'reading' | 'done' | 'failed' | 'cancelled';

export type Upload = {
  key: string;
  fileName: string;
  bytes: number;
  scope: ListScope;
  supplierId?: string;
  phase: Phase;
  sent: number;
  listId?: string;
  progress?: ListProgress;
  state?: ListState;
  // Quien sube eligió cambiar el proveedor: se ve la lista para elegir (R4.3).
  choosing?: boolean;
  error?: string | undefined;
};

const thousands = (n: number) => n.toLocaleString('es-AR');

// R4.2: lo que no es una planilla o pasa el tamaño se rechaza sin subirlo.
export function refusalOf(file: { name: string; size: number }, maxMb: number | undefined) {
  const name = file.name.toLowerCase();
  if (!listExtensions.some((extension) => name.endsWith(extension)))
    return texts.notSheet(file.name);
  if (maxMb !== undefined && file.size > maxMb * 2 ** 20) return texts.tooBig(file.name, maxMb);
  return undefined;
}

type Words = { long: string; short: string };
const say = (text: string): Words => ({ long: text, short: text });

// En qué va (R4.9).
function stepOf(upload: Upload): Words | undefined {
  const progress = upload.progress;
  if (upload.phase === 'sending')
    return say(
      texts.sending(Math.min(100, Math.round((upload.sent / Math.max(upload.bytes, 1)) * 100))),
    );
  if (upload.phase === 'cancelled') return say(texts.cancelled);
  if (!progress) return undefined;
  if (progress.status === 'unreadable')
    return texts.unreadable(listReasonTexts[progress.reason ?? 'no-reader']);
  if (progress.status === 'discarded') return say(texts.discarded);
  if (progress.status === 'queued') return say(texts.queued);
  if (upload.phase === 'done') return say(texts.read(thousands(progress.rowsRead)));
  const total = progress.rowsTotal === undefined ? undefined : thousands(progress.rowsTotal);
  return say(texts.reading(thousands(progress.rowsRead), total));
}

export type Question =
  | { kind: 'size'; words: { long: string; short: string } }
  | { kind: 'confirm'; name: string }
  | { kind: 'choose' }
  | { kind: 'known'; name: string }
  | { kind: 'none' };

// De quién es (R4.3): lo eligió quien sube, lo reconoció su lector o se confirmó, se ve con
// «Cambiar»; deducido por el nombre, se pregunta; sin ninguno, se elige. Una planilla muy grande
// pregunta antes si leerla (R4.12).
export function questionOf(upload: Upload): Question {
  const live = upload.phase === 'reading' || upload.phase === 'done';
  if (!live || !upload.progress) return { kind: 'none' };
  if (upload.progress.waitingFor === 'size' && upload.progress.rowsTotal !== undefined)
    return { kind: 'size', words: texts.big(thousands(upload.progress.rowsTotal)) };
  return supplierQuestion(upload, upload.progress);
}

function supplierQuestion(upload: Upload, progress: ListProgress): Question {
  const supplier = upload.state?.supplier;
  if (upload.choosing || (!supplier && progress.waitingFor === 'supplier'))
    return { kind: 'choose' };
  if (!supplier) return { kind: 'none' };
  if (supplier.from === 'name' && !supplier.confirmed)
    return { kind: 'confirm', name: supplier.name };
  return { kind: 'known', name: supplier.name };
}

// R4.8: si el proveedor ya tenía otra lista en espera, esta la reemplaza.
export function replacesOther(upload: Upload, suppliers: readonly SupplierRow[]): boolean {
  const supplier = upload.state?.supplier;
  if (!supplier || upload.phase !== 'reading') return false;
  const pending = suppliers.find((row) => row.id === supplier.id)?.pending;
  return pending?.status === 'pending' && pending.listId !== upload.listId;
}

export const linesOf = (upload: Upload, suppliers: readonly SupplierRow[]) => ({
  key: upload.key,
  fileName: upload.fileName,
  step: stepOf(upload),
  error: upload.error,
  question: questionOf(upload),
  scopes: (['full', 'partial'] as const).map((value) => ({
    value,
    label: value === 'full' ? texts.full : texts.partial,
    checked: upload.scope === value,
  })),
  partial: upload.scope === 'partial',
  replaces: replacesOther(upload, suppliers),
  // Cancelar mientras sube o lee (R4.11); cerrar lo que terminó.
  canCancel: upload.phase === 'sending' || upload.phase === 'reading',
  canClose: upload.phase !== 'sending' && upload.phase !== 'reading',
  canScope: upload.phase === 'sending' || upload.phase === 'reading',
  failed: upload.phase === 'failed' || upload.progress?.status === 'unreadable',
});
export type UploadLines = ReturnType<typeof linesOf>;
