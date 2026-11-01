// Texto para buscar: sin mayúsculas ni tildes, así «lucia» encuentra a «Lucía». Lo usan todos los
// buscadores de la aplicación (personas, roles, el manual).
export const plain = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
