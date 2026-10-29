// La dirección del manual (diseño del manual, § 5): /manual?d=phone&c=sign-in&t=offline&p=2. Guarda
// dónde se está, así recargar deja en el mismo paso. Lo que viene en ella solo se acepta si existe en
// el índice: si no, se ignora y se abre el principio. Este archivo no arma nombres de archivos (el
// capítulo que se pide adelantado lo valida useManual con `isName`).
import { type Device, devices, type ManualIndex } from '@ferrebress/shared/contracts/manual';

export const manualPath = '/manual';

export type Address = { device?: Device; chapter?: string; task?: string; step?: number };

export function readAddress(search: string): Address {
  const params = new URLSearchParams(search);
  const device = devices.find((one) => one === params.get('d'));
  const step = Number(params.get('p'));
  return {
    ...(device && { device }),
    ...(params.get('c') && { chapter: params.get('c') as string }),
    ...(params.get('t') && { task: params.get('t') as string }),
    ...(Number.isInteger(step) && step > 0 && { step: step - 1 }),
  };
}

// Lo que de la dirección existe en el índice, para el dispositivo elegido.
export function validAddress(address: Address, index: ManualIndex, device: Device): Address {
  const chapter = index.chapters.find((entry) => entry.id === address.chapter && entry.tasks);
  const task = chapter?.tasks?.find((one) => one.id === address.task && one.device === device);
  if (!chapter || !task) return {};
  const step = Math.min(address.step ?? 0, task.steps - 1);
  return { device, chapter: chapter.id, task: task.id, step };
}

export function writeAddress(address: Address): string {
  const params = new URLSearchParams();
  if (address.device) params.set('d', address.device);
  if (address.chapter) params.set('c', address.chapter);
  if (address.task) params.set('t', address.task);
  if (address.step !== undefined) params.set('p', String(address.step + 1));
  const query = params.toString();
  return query ? `${manualPath}?${query}` : manualPath;
}
