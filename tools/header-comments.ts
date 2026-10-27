// Que cada archivo de código empiece con el comentario que dice de qué se encarga (constitución,
// XII). Si ese comentario sigue siendo cierto no lo puede saber una herramienta: lo mira el
// revisor del código.

import { readText } from './files.ts';
import { isTest, listSourceCode } from './source-code.ts';

// Las líneas que van antes del comentario por obligación: el intérprete y la sintaxis de Docker.
const preamble = /^(#!|# syntax=|<!doctype)/i;
const comment = /^(\/\/|\/\*|#|<!--)/;

export function findFilesWithoutHeader(root: string): string[] {
  return listSourceCode(root)
    .filter((path) => !isTest(path))
    .filter((path) => {
      const first = readText(root, path)
        .split('\n')
        .map((line) => line.trim())
        .find((line) => line !== '' && !preamble.test(line));
      return !first || !comment.test(first);
    })
    .map((path) => `${path}: falta el comentario que dice de qué se encarga`);
}
