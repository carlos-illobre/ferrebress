// Si el celular y la computadora están en la misma red (R2.5): si salen a internet por la misma
// dirección, contada por red (la de la plataforma). Sin tecnología.
import { networkOf } from '../../../platform/network.ts';

export { networkOf };

export const sameNetwork = (a: string, b: string): boolean => networkOf(a) === networkOf(b);
