// Lo que comparten las pruebas de rendimiento (`pnpm perf`): medir cuánto tarda algo y juntar las
// medidas, para imprimirlas al final y anotarlas.
export function createTimer() {
  const measured: Record<string, string> = {};
  const timed = async <T>(name: string, run: () => Promise<T> | T) => {
    const started = performance.now();
    const value = await run();
    const ms = performance.now() - started;
    measured[name] = `${Math.round(ms)} ms`;
    return { value, ms };
  };
  return { measured, timed };
}
