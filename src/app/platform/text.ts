// Texto para buscar: sin mayúsculas ni tildes, así «lucia» encuentra a «Lucía». Solo saca las
// marcas que se combinan con una letra: «·» y otros signos quedan, así el texto no cambia de largo. Lo usan todos los
// buscadores de la aplicación (personas, roles, el manual).
export const plain = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
