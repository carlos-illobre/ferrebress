// Lo común del lector del manual (diseño del manual, § 2): los problemas, que dicen archivo y
// renglón, y lo que no puede tener un texto del manual.
export type Problems = string[];

export const problemAt = (file: string, line: number, message: string) =>
  `docs/manual/${file}:${line}: ${message}`;

// Nombres de archivos, capítulos, tareas, escenas y puntos: en inglés, minúsculas y guiones.
export const isName = (value: string) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value);

// Solo texto: nada que el navegador pudiera leer como HTML (diseño del manual, § 8).
export function textProblem(text: string): string | undefined {
  if (text.trim() === '') return 'el texto está vacío';
  if (/[<>]/.test(text)) return 'el texto no puede tener < ni >';
  if (/&[#a-zA-Z0-9]+;/.test(text)) return 'el texto no puede tener entidades de HTML (&…;)';
  return undefined;
}

// Un renglón con partes separadas por « · ».
export const splitDots = (line: string) => line.split(' · ').map((part) => part.trim());
