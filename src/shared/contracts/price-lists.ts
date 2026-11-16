// Las listas de precios (capítulo 08; diseño de 08, § 3): lo que piden y devuelven sus rutas. Lo
// comparten el servidor, que valida, y la aplicación, que muestra y valida antes de mandar. Los costos
// viajan en millonésimos de peso, como texto: en un JSON un número tan grande pierde precisión.
import * as z from 'zod/mini';

// --- Los proveedores (R2) ---

export const supplierLimits = { name: 80, seller: 80, phone: 40, email: 120, note: 500 } as const;
export const supplierFields = ['name', 'seller', 'phone', 'email', 'note'] as const;
export type SupplierField = (typeof supplierFields)[number];
// Los datos de contacto del vendedor: en Quién hizo qué, solo que cambiaron (R9.1, E11).
export const privateSupplierFields: readonly SupplierField[] = ['seller', 'phone', 'email'];

// Un texto sin espacios de más; vacío, no hay dato.
const trimmed = (max: number) => z.string().check(z.trim(), z.maxLength(max));
const filled = (max: number) => z.string().check(z.trim(), z.minLength(1), z.maxLength(max));
const emailShape = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Cómo vale cada dato: el nombre, de 1 a 80 letras; el correo, con forma de correo. `null`, sin dato.
export function supplierValue(field: SupplierField, raw: unknown): string | null | undefined {
  if (raw === null) return field === 'name' ? undefined : null;
  const parsed = trimmed(supplierLimits[field]).safeParse(raw);
  if (!parsed.success) return undefined;
  const text = parsed.data;
  if (text === '') return field === 'name' ? undefined : null;
  if (field === 'email' && !emailShape.test(text)) return undefined;
  return text;
}

export const newSupplierBody = z.strictObject({
  name: z.string(),
  seller: z.optional(z.nullable(z.string())),
  phone: z.optional(z.nullable(z.string())),
  email: z.optional(z.nullable(z.string())),
  note: z.optional(z.nullable(z.string())),
});
export type NewSupplierBody = z.infer<typeof newSupplierBody>;

// Cambiar un dato (R1.7): el valor que se vio y el nuevo. Choca solo quien cambió el mismo dato.
export const changeSupplierBody = z.strictObject({
  field: z.enum(supplierFields),
  before: z.nullable(z.string()),
  value: z.nullable(z.string()),
});
export type ChangeSupplierBody = z.infer<typeof changeSupplierBody>;

// --- Cómo cobra (R3) ---

export const defaultVats = [210, 105, 270] as const;
export const maxDiscounts = 20;
export const discountLimits = { name: 40, brand: 80, percent: { min: 1, max: 9999 } } as const;

const discount = z.strictObject({
  id: z.string().check(z.regex(/^[0-9A-Za-z_-]{1,40}$/)),
  name: filled(discountLimits.name),
  // En centésimos de por ciento: 2,5 % es 250 (R3.2, E20, E92).
  percent: z
    .int()
    .check(z.minimum(discountLimits.percent.min), z.maximum(discountLimits.percent.max)),
  // La marca como se escribió; `null`, todas. Se compara sin acentos ni mayúsculas (E19).
  brand: z.nullable(filled(discountLimits.brand)),
});

export const termsSchema = z.strictObject({
  vatIncluded: z.boolean(),
  discounts: z.array(discount).check(z.maxLength(maxDiscounts)),
  defaultVat: z.union([z.literal(210), z.literal(105), z.literal(270)]),
  onChange: z.enum(['recalculate', 'next']),
});
export type Terms = z.infer<typeof termsSchema>;
export type TermsDiscount = Terms['discounts'][number];

// De arranque (E09): sin IVA incluido, sin descuentos, 21 % y «Recalcular con la última lista».
export const initialTerms = (): Terms => ({
  vatIncluded: false,
  discounts: [],
  defaultVat: 210,
  onChange: 'recalculate',
});

const count = z.int().check(z.minimum(0), z.maximum(2 ** 31 - 1));

export const termsBody = z.strictObject({
  terms: termsSchema,
  version: count,
  // Cuántos costos cambian, como los vio quien confirma (R3.5, E21).
  confirmed: z.optional(count),
});
export type TermsBody = z.infer<typeof termsBody>;

// Dar de baja (R2.4, E12): los dos números que vio quien confirma.
export const deactivateBody = z.strictObject({
  confirmed: z.optional(z.strictObject({ costs: count, discontinued: count })),
});
export type DeactivateBody = z.infer<typeof deactivateBody>;

// --- Lo que devuelven ---

export type SupplierContact = {
  seller?: string;
  phone?: string;
  email?: string;
  note?: string;
};

// En la lista: lo que ve cualquiera con sesión (R1.3); con «Ver costos», la fecha de su última lista
// y si tiene una lista viva (R1.1).
export type SupplierRow = SupplierContact & {
  id: string;
  name: string;
  lastListDate?: string;
  liveList?: true;
};
export type SuppliersResponse = { suppliers: SupplierRow[] };

// Uno: sus datos; con «Ver costos», cómo cobra (R2.3).
export type SupplierResponse = SupplierContact & {
  id: string;
  name: string;
  inactive: boolean;
  lastListDate?: string;
  terms?: { value: Terms; version: number };
};

export type TermsResponse = { value: Terms; version: number; costs: number };

// Los errores con lo que la pantalla necesita para decirlo.
export type SupplierExists =
  | { error: 'supplier-exists' }
  | { error: 'supplier-inactive'; id: string };
export type FieldChanged = { error: 'field-changed'; value: string | null };
export type TermsChanged = { error: 'terms-changed'; value: Terms; version: number };
export type ConfirmCosts = { error: 'confirm-costs'; costs: number };
export type ConfirmDeactivate = {
  error: 'confirm-deactivate';
  costs: number;
  discontinued: number;
};
