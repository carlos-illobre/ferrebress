// Los campos que los módulos del servidor suman a la cabecera (diseño de 03, § 3.5): quien quiere uno
// lo escucha por su letra, y se entera cuando cambia, también cuando deja de venir. `api()` espera a
// quienes escuchan antes de devolver la respuesta: así un módulo puede frenar algo hasta saber qué
// cambió (el espejo, hasta confirmar el vínculo). Sin canal ni consultas propias.
type Listener = (value: string | undefined) => void | Promise<void>;

const listeners = new Map<string, Set<Listener>>();
const last = new Map<string, string | undefined>();

// Escucha un campo; devuelve cómo dejar de escucharlo.
export function onField(letter: string, listener: Listener): () => void {
  const set = listeners.get(letter) ?? new Set<Listener>();
  set.add(listener);
  listeners.set(letter, set);
  return () => void set.delete(listener);
}

// Los campos de una respuesta: avisa los que cambiaron y espera a quienes escuchan.
export async function readFields(fields: Record<string, string>): Promise<void> {
  const waits: (void | Promise<void>)[] = [];
  for (const [letter, set] of listeners) {
    const value = fields[letter];
    if (last.get(letter) === value && last.has(letter)) continue;
    last.set(letter, value);
    for (const listener of set) waits.push(listener(value));
  }
  await Promise.all(waits);
}

// Para las pruebas: olvida lo último que se vio.
export const forgetFields = () => last.clear();
