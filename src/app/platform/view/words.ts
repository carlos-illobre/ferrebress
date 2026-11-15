// Un texto con sus dos formas (00 · R3): la larga, que explica, en la computadora; la corta, que solo
// identifica, en el celular y en cualquier pantalla angosta. Es parte del contrato de las vistas
// (ADR-019): la lógica arma los textos así y cada vista elige cómo mostrar las dos formas.
export type Words = { long: string; short: string };
