// Los números del catálogo que son iguales en todos los ambientes (diseño de 07, § 3, § 5 y § 9).
const second = 1000;
const minute = 60 * second;

export const catalogSettings = {
  // Como mucho los productos que no están dados de baja (07 · R3.5).
  maxActive: 200_000,
  // De a cuántos se lista.
  page: 50,
  // Lo que queda de la última búsqueda de cada sesión, para las páginas siguientes.
  searchKeepMs: minute,
  // Cuánto espera un cambio a que termine una lista que se aplica antes de rechazarse.
  waitListMs: 5 * second,
  limits: {
    search: { max: 120, windowMs: minute },
    changes: { max: 60, windowMs: minute },
  },
};
