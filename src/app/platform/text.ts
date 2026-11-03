// Texto para buscar: sin mayúsculas ni tildes, así «lucia» encuentra a «Lucía». Solo saca las
// marcas que se combinan con una letra: «·» y otros signos quedan, así el texto no cambia de largo. Lo usan todos los
// buscadores de la aplicación (personas, roles, el manual).
export const plain = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

// Las dos letras del círculo de una persona: las primeras de su nombre o, sin nombre, las de lo que
// se use en su lugar (su correo). Las mismas en el menú, en Usuarios y en la auditoría.
export function initials(name: string, otherwise = ''): string {
  const words = name.split(/\s+/).filter(Boolean);
  const letters =
    words.length > 0
      ? words
          .slice(0, 2)
          .map((word) => word[0])
          .join('')
      : otherwise.slice(0, 2);
  return letters.toUpperCase();
}
