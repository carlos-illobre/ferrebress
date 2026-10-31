// Los textos de «Sin permiso» y de «Ya no tenés permiso» (02 · R7.7, R7.8), que se bajan con sus
// pantallas: el arranque no los trae.
import type { Words } from '../../../../ui/say/Say.tsx';

export const words = {
  title: (screen: string) => `No tenés permiso para ${screen}`,
  needs: { long: 'Hace falta', short: 'Falta' },
  holders: 'Lo tienen',
  count: (roles: number, people: number) =>
    `${roles} ${roles === 1 ? 'rol' : 'roles'} · ${people} ${people === 1 ? 'persona' : 'personas'}`,
  people: (count: number) => `${count} ${count === 1 ? 'persona' : 'personas'}`,
  nobody: 'Ningún rol lo tiene todavía.',
  grantedBy: {
    long: 'Te lo puede dar quien tiene «Administrar roles»:',
    short: 'Te lo dan',
  },
  yours: 'Vos tenés',
  goTo: (option: string) => `Ir a ${option}`,
  going: 'Yendo',
  copy: 'Copiar el pedido',
  copying: 'Copiando',
  copied: 'Pedido copiado: pegalo en un mensaje a quien te lo puede dar.',
  request: (name: string, permission: string, screen: string) =>
    `Hola, soy ${name}. ¿Me podés dar el permiso «${permission}» en Ferrebress? Lo necesito para usar ${screen}.`,
  lostTitle: (screen: string) => `Ya no tenés permiso para ${screen}`,
  lostBy: (by: string | null, removed: string[]) =>
    `${by ?? 'Alguien'} te ${removed.length > 0 ? `sacó ${removed.map((role) => `«${role}»`).join(' y ')}` : 'cambió los permisos de un rol'} recién. Lo demás sigue igual.`,
  had: 'Tenías',
  have: 'Tenés',
  kept: 'Lo que estabas haciendo en otra parte sigue como lo dejaste.',
  leaving: (option: string) => `Te llevo a ${option}`,
  goNow: (option: string) => `Ir a ${option} ahora`,
} satisfies Record<string, string | Words | ((...args: never[]) => string)>;
