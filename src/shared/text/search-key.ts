// La clave para comparar y buscar un texto como lo haría una persona (08 · R1.1, R2.1): sin acentos,
// sin mayúsculas y sin espacios de más. Se guarda junto al texto para ponerle un índice o hacerlo
// único, y la usan los buscadores, así el servidor y la aplicación encuentran lo mismo.
export const searchKey = (text: string): string =>
  text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('es').replace(/\s+/g, ' ').trim();
