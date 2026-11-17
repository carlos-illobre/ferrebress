// Leer una lista (08 · R4, R5; diseño de 08, § 1 y § 4), dentro del proceso lector: abrir la planilla
// (un CSV, de a partes: source.ts), preguntar si es muy grande, deducir la fecha y de quién es, elegir
// el lector y leer de a bloques, comprobando cada uno. Lo que va pasando lo cuenta con `send`; guardar es del servidor.
import type { Block, Head } from '@ferrebress/shared/contracts/price-lists';
import { autoDoubts, detectAuto } from '../rules/auto.ts';
import { type Checked, checkBlock } from '../rules/check.ts';
import { listDateOf, supplierByName } from '../rules/deduce.ts';
import type { ChosenReader, Job, JobMessage, JobReader } from './messages.ts';
import { runReader } from './sandbox.ts';
import { sourceOf } from './source.ts';

type Send = (message: JobMessage) => void | Promise<void>;
type Candidate = { reader: ChosenReader; code: string; params: unknown; supplierId: string | null };
type Reading = { candidate: Candidate; first: Checked; firstBlock: Block };

// Lee y comprueba un bloque con un lector; `undefined` si no pasa.
async function readBlock(
  job: Job,
  candidate: Candidate,
  block: Block,
  head: Head,
  seen: Set<string>,
) {
  const ran = await runReader(candidate.code, candidate.params, 'read', [block, head], job.limits);
  if (!('ok' in ran)) return undefined;
  const checked = checkBlock(block, ran.ok, seen);
  return 'problem' in checked ? undefined : checked;
}

// Los lectores en orden (R5.2, E41): los del proveedor y los de un programador sin proveedor si se
// sabe de quién es; si no, todos. Los de otro proveedor no deciden por uno conocido (R4.3).
function candidatesOf(job: Job): Candidate[] {
  const usable = (reader: JobReader) =>
    job.supplierId === null || reader.supplierId === job.supplierId || reader.supplierId === null;
  const own = (reader: JobReader) => (reader.supplierId === null ? 1 : 0);
  return job.readers
    .filter(usable)
    .sort((a, b) => own(a) - own(b))
    .map((reader) => ({
      reader: { id: reader.id },
      code: reader.code,
      params: reader.params,
      supplierId: reader.supplierId,
    }));
}

// El primero que reconoce la planilla y pasa la comprobación del primer bloque; si ninguno, el
// automático, si no duda.
async function choose(job: Job, head: Head, first: Block): Promise<Reading | JobMessage> {
  for (const candidate of candidatesOf(job)) {
    const says = await runReader(
      candidate.code,
      candidate.params,
      'recognizes',
      [head],
      job.limits,
    );
    if (!('ok' in says) || says.ok !== 'yes') continue;
    const checked = await readBlock(job, candidate, first, head, new Set());
    if (checked) return { candidate, first: checked, firstBlock: first };
  }
  return chooseAuto(job, head, first);
}

async function chooseAuto(job: Job, head: Head, first: Block): Promise<Reading | JobMessage> {
  const params = detectAuto(head);
  if (params === 'no') return { type: 'failed', reason: 'no-reader' };
  if (params === 'unsure') return { type: 'failed', reason: 'auto-unsure' };
  const candidate: Candidate = {
    reader: { template: 'auto-1', params },
    code: job.autoCode,
    params,
    supplierId: null,
  };
  const checked = await readBlock(job, candidate, first, head, new Set());
  if (!checked) return { type: 'failed', reason: 'auto-unsure' };
  return { candidate, first: checked, firstBlock: first };
}

export async function runJob(job: Job, send: Send): Promise<void> {
  const source = await sourceOf(job);
  if ('failed' in source) return send({ type: 'failed', reason: source.failed });
  const rows = source.rows;
  if (rows === 0) return send({ type: 'failed', reason: 'empty' });
  if (job.confirmRows !== null && rows > job.confirmRows) return send({ type: 'size', rows });
  send({ type: 'opened', rows });
  const head = await source.head();
  const blocks = source.blocks();
  const chosen = await choose(job, head, (await blocks.next()).value as Block);
  if ('type' in chosen) return send(chosen);
  send(chosenMessage(job, chosen.candidate, head));
  await readAll(job, head, blocks, chosen, send);
}

function chosenMessage(job: Job, candidate: Candidate, head: Head): JobMessage {
  const byName = supplierByName(head, job.fileName, job.suppliers);
  const supplier =
    candidate.supplierId !== null
      ? { id: candidate.supplierId, from: 'reader' as const }
      : byName
        ? { id: byName, from: 'name' as const }
        : null;
  return {
    type: 'chosen',
    reader: candidate.reader,
    supplier: job.supplierId === null ? supplier : null,
    date: listDateOf(head, job.fileName, job.today),
    head,
  };
}

async function* withFirst(first: Block, rest: AsyncIterable<Block>): AsyncGenerator<Block> {
  yield first;
  yield* rest;
}

// Todos los bloques, el primero ya leído. Si uno no pasa, la lista no se lee (R5.4); el automático,
// además, no puede terminar con casi nada leído (R5.5).
async function readAll(
  job: Job,
  head: Head,
  rest: AsyncIterable<Block>,
  chosen: Reading,
  send: Send,
) {
  const seen = new Set<string>();
  let [products, skipped, rowsRead] = [0, 0, 0];
  for await (const block of withFirst(chosen.firstBlock, rest)) {
    const checked =
      block === chosen.firstBlock
        ? checkAgain(chosen, seen)
        : await readBlock(job, chosen.candidate, block, head, seen);
    if (!checked) return send({ type: 'failed', reason: 'reader-failed' });
    [products, skipped, rowsRead] = [
      products + checked.products.length,
      skipped + checked.skipped.length,
      rowsRead + block.rows.length,
    ];
    await send({ type: 'block', ...checked, rowsRead });
  }
  if ('template' in chosen.candidate.reader && autoDoubts(products, skipped))
    return send({ type: 'failed', reason: 'auto-unsure' });
  send({ type: 'done' });
}

// El primer bloque ya se comprobó al elegir: se suman sus códigos a los vistos.
function checkAgain(chosen: Reading, seen: Set<string>): Checked {
  for (const product of chosen.first.products) seen.add(product.code);
  return chosen.first;
}
