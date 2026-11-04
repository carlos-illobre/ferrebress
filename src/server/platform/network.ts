// La red de una dirección, para contar por red y no por aparato (diseño de 01, § 5, y de 03, § 3.3):
// IPv4 entera (también escrita como IPv6, ::ffff:a.b.c.d) e IPv6 por su /64, porque cada aparato de
// una misma red tiene la suya. Sin negocio.
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
