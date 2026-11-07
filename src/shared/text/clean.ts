// Cómo se limpia un texto que escribe una persona y ven otras (un nombre de persona, de rol o de
// dispositivo): en NFC (así «Café» escrito de dos formas es el mismo), sin caracteres de control ni de
// formato (entre ellos los invisibles y los que cambian la dirección del texto), sin los que no son
// letras de nadie (de uso privado, sin asignar, mitades sueltas), sin los rellenos que se ven en
// blanco (como espacios), con a lo sumo dos marcas sobre cada letra, sin espacios de más y dentro del
// largo, contado en letras y no en bytes. Vacío es ninguno. Lo usan el servidor y la aplicación, así
// cuentan igual.
const unsafe = /[\p{Cc}\p{Cf}\p{Co}\p{Cn}\p{Cs}]/gu;
const blanks = /[\u115F\u1160\u2800\u3164\uFFA0]/gu;
const piledMarks = /(\p{M}{2})\p{M}+/gu;

export const cleanText = (text: string | null | undefined, max: number): string | null => {
  const clean = (text ?? '')
    .normalize('NFC')
    .replace(unsafe, '')
    .replace(blanks, ' ')
    .replace(piledMarks, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  return clean === '' ? null : [...clean].slice(0, max).join('');
};

// Cuántas letras tiene, como las cuenta cleanText.
export const lettersIn = (text: string) => [...text.normalize('NFC')].length;

// Si dos textos limpios son el mismo para una persona: sin distinguir mayúsculas ni tildes.
export const sameText = (a: string, b: string) =>
  a.localeCompare(b, 'es', { sensitivity: 'base' }) === 0;
