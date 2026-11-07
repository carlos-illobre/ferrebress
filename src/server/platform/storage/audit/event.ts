// La forma común de una acción anotada (diseño de 05, § 2): quién, a quién, qué cambió, desde dónde
// y de qué color. La comparten todos los módulos que anotan, sin saber nada de cómo se guarda.

// Quién la hizo: una persona (de la sesión o recién probada), el sistema o alguien sin entrar.
export type Actor =
  | { kind: 'person'; userId: string; name?: string }
  | { kind: 'system' }
  | { kind: 'outsider'; email?: string };

// A quién o a qué: una persona, un rol, una sesión, un celular… con el nombre de ese momento.
export type Target = { kind: string; id: string; name?: string };

export type Tone = 'plain' | 'amber' | 'red';

export type Changes = Record<string, { before: unknown; after: unknown }>;

// El dispositivo en códigos (la lista cerrada de platform/device.ts), no en texto, y el nombre que le
// puso la persona en ese momento, si tiene (04 · R9).
export type DeviceCodes = { phone: boolean; browser?: string; os?: string; name?: string };

// Cómo queda una persona después de esta acción, para «(hoy: …)» y los filtros (diseño de 05, § 3).
export type PersonState = 'active' | 'deactivated' | 'deleted';
export type PersonUpdate = { userId: string; name: string; email?: string; state: PersonState };

export type AuditEvent = {
  type: string;
  at: Date;
  actor: Actor;
  // La hora en que llegó, si `at` es otra (lo hecho sin conexión); la del dispositivo, si el servidor
  // no la pudo confirmar.
  arrivedAt?: Date;
  deviceTime?: Date;
  targets?: Target[];
  changes?: Changes;
  data?: Record<string, unknown>;
  device?: DeviceCodes;
  ipAddress?: string;
  people?: PersonUpdate[];
};

// Lo que quedó guardado: con su id (año y número), su color y los nombres de ese momento.
export type StoredEvent = AuditEvent & { id: string; tone: Tone; truncated?: true };

// Cómo se calcula el color de una acción: lo da el módulo que conoce los tipos (diseño de 05, § 4).
export type ToneOf = (event: AuditEvent) => Tone;
