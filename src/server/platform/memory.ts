// Una memoria de lo que se lee de la base que no puede quedar con algo viejo (diseño de 02, § 17):
// cada olvido sube un contador, y lo leído se guarda solo si nadie olvidó nada mientras se leía.
// Quien cambia la base olvida después de confirmar: una lectura que empezó antes y termina después
// no se guarda, y una que terminó antes la borra el olvido. La usan la memoria de permisos y la de
// personas.

export function createGuardedMemory<K, V>() {
  const values = new Map<K, V>();
  let forgets = 0;
  return {
    async load(key: K, read: () => Promise<V>): Promise<V> {
      if (values.has(key)) return values.get(key) as V;
      const before = forgets;
      const value = await read();
      if (forgets === before) values.set(key, value);
      return value;
    },
    // Lo que hay en memoria, sin leer la base: para lo que no puede esperar (la cabecera).
    peek: (key: K): V | undefined => values.get(key),
    forget(keys: readonly K[] | 'all'): void {
      forgets++;
      if (keys === 'all') values.clear();
      else for (const key of keys) values.delete(key);
    },
  };
}

export type GuardedMemory<K, V> = ReturnType<typeof createGuardedMemory<K, V>>;
