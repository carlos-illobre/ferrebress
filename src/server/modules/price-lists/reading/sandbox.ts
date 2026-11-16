// Correr un lector encerrado (08 · R5.10; ADR-021): QuickJS compilado a WebAssembly, un contexto nuevo
// en cada corrida, sin ninguna función del servidor, con tope de memoria, de pila y de tiempo. Lo que
// entra y sale es texto JSON: el lector recibe las celdas como datos y devuelve datos.
import variant from '@jitl/quickjs-wasmfile-release-sync';
import { newQuickJSWASMModuleFromVariant, type QuickJSWASMModule } from 'quickjs-emscripten-core';

export type SandboxLimits = { memoryBytes: number; stackBytes: number; timeMs: number };
export type SandboxResult = { ok: unknown } | { failed: 'timeout' | 'memory' | 'error' };

// El paquete trae un solo archivo de tipos para `import` y `require`, y TypeScript lo lee como el de
// `require`: en `import`, lo que llega es la variante misma.
type Variant = Parameters<typeof newQuickJSWASMModuleFromVariant>[0];

let engine: Promise<QuickJSWASMModule> | undefined;
const quickJS = () => {
  engine ??= newQuickJSWASMModuleFromVariant(variant as unknown as Variant);
  return engine;
};

// Corre `code` (que deja `globalThis.reader`) y llama a `reader[call](...args)`. `params`, los datos
// del lector automático.
export async function runReader(
  code: string,
  params: unknown,
  call: 'recognizes' | 'read',
  args: unknown[],
  limits: SandboxLimits,
): Promise<SandboxResult> {
  const runtime = (await quickJS()).newRuntime();
  runtime.setMemoryLimit(limits.memoryBytes);
  runtime.setMaxStackSize(limits.stackBytes);
  const deadline = Date.now() + limits.timeMs;
  let timedOut = false;
  runtime.setInterruptHandler(() => {
    timedOut = Date.now() > deadline;
    return timedOut;
  });
  const vm = runtime.newContext();
  try {
    const input = vm.newString(JSON.stringify({ params: params ?? null, args }));
    vm.setProp(vm.global, '__input', input);
    input.dispose();
    const program =
      `globalThis.params = JSON.parse(__input).params;\n${code}\n;` +
      `JSON.stringify({ out: globalThis.reader.${call}(...JSON.parse(__input).args) })`;
    const result = vm.evalCode(program, 'reader.js');
    if (result.error) {
      const error = vm.dump(result.error) as { message?: string } | string;
      result.error.dispose();
      if (/out of memory/i.test(JSON.stringify(error))) return { failed: 'memory' };
      return { failed: timedOut ? 'timeout' : 'error' };
    }
    const text = vm.getString(result.value);
    result.value.dispose();
    return { ok: (JSON.parse(text) as { out?: unknown }).out };
  } finally {
    vm.dispose();
    runtime.dispose();
  }
}
