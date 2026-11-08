// Los tiempos de Administración en la aplicación, con nombre y en un solo lugar.
export const administrationSettings = {
  // Cuánto se ve «Deshacer» después de un cambio (R2.1).
  undoMs: 5000,
  // Cada cuánto se mueve la hora del negocio en la pantalla (R5.1), sin pedidos.
  clockMs: 30_000,
  // Las semanas del calendario del vínculo: en la computadora, un año; en el celular, medio.
  weeks: { wide: 54, narrow: 26 },
};
