// Si el celular y la computadora están en la misma red (R2.5): si salen a internet por la misma
// dirección. Sin tecnología.
// La red de una dirección: IPv4 entera (también escrita como IPv6, ::ffff:a.b.c.d); IPv6 por su
// /64, porque cada aparato de una misma red tiene la suya.
export function networkOf(ipAddress: string): string {
  if (ipAddress.includes('.')) return ipAddress.slice(ipAddress.lastIndexOf(':') + 1);
  const [head = '', tail] = ipAddress.split('::');
  const left = head.split(':').filter(Boolean);
  const right = tail?.split(':').filter(Boolean) ?? [];
  const groups =
    tail === undefined
      ? left
      : [...left, ...Array(8 - left.length - right.length).fill('0'), ...right];
  return groups
    .slice(0, 4)
    .map((group) => Number.parseInt(group, 16).toString(16))
    .join(':');
}

export const sameNetwork = (a: string, b: string): boolean => networkOf(a) === networkOf(b);
