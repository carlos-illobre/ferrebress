// Qué le dice el celular sobre dónde está la computadora que pide entrar (R2.5): la misma red,
// la misma ciudad, ciudades distintas o una ciudad desconocida, que cuenta como distinta. Sin
// tecnología: las ciudades llegan ya buscadas.
export type Place =
  | { kind: 'same-network' }
  | { kind: 'same-city'; city: string }
  | { kind: 'different-cities'; computerCity: string; phoneCity: string }
  | { kind: 'unknown-city' };

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

export function placeOf(
  computer: { ipAddress: string; city: string | undefined },
  phone: { ipAddress: string; city: string | undefined },
): Place {
  if (networkOf(computer.ipAddress) === networkOf(phone.ipAddress)) return { kind: 'same-network' };
  if (!computer.city || !phone.city) return { kind: 'unknown-city' };
  if (computer.city === phone.city) return { kind: 'same-city', city: computer.city };
  return { kind: 'different-cities', computerCity: computer.city, phoneCity: phone.city };
}
