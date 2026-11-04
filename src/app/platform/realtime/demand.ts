// Qué temas pide la pestaña y quién los pide (diseño de 03, § 3.2): el canal se abre con lo que hay
// pedido y se cierra cuando no queda nada. Varios pedidos del mismo tema cuentan como uno.

// Quien pide un tema: qué hacer con lo que llega y, si quiere, con un rechazo o una baja.
export type TopicHandler = {
  onEvent(data: unknown): void;
  onRefused?(code: string): void;
  // El servidor soltó la clave (un vínculo que terminó).
  onDropped?(): void;
};

export function createDemand(onChange: () => void) {
  const wanted = new Map<string, Set<TopicHandler>>();
  return {
    // Pide un tema; devuelve cómo dejar de pedirlo.
    want(token: string, handler: TopicHandler): () => void {
      const handlers = wanted.get(token) ?? new Set<TopicHandler>();
      handlers.add(handler);
      wanted.set(token, handlers);
      onChange();
      return () => {
        handlers.delete(handler);
        if (handlers.size === 0) wanted.delete(token);
        onChange();
      };
    },
    tokens: (): string[] => [...wanted.keys()],
    has: (token: string) => wanted.has(token),
    handlersOf: (token: string): TopicHandler[] => [...(wanted.get(token) ?? [])],
  };
}

export type Demand = ReturnType<typeof createDemand>;
