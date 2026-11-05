// Los tiempos y topes de Usuarios en el servidor: todos con nombre, en un lugar.
const minute = 60_000;
export const usersSettings = {
  // Los cambios desde Usuarios, por sesión (02, § 9).
  changes: { max: 60, windowMs: minute },
  throttledAudit: { max: 1, windowMs: minute },
  // Autorizar, cambiar el correo y dar de alta, con Google o la huella de hace menos de esto (R3.8).
  confirmWithinMs: 5 * minute,
};
