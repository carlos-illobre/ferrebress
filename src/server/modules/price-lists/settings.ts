// Lo fijo de las listas de precios (diseño de 08, § 7), con nombre y en un solo lugar.
const minute = 60_000;

export const priceListsSettings = {
  // Los cambios de una sesión en los proveedores: una pantalla que se toca poco.
  changes: { max: 60, windowMs: minute },
  // Un rechazo repetido se anota una vez por ventana.
  throttledAudit: { max: 1, windowMs: minute },
  // Recalcular y dar de baja, de a tandas de esta cantidad de artículos.
  batch: 1000,
};
