// Las pantallas de entrada abiertas en las computadoras, en la memoria del servidor (diseño de
// 01, § 5 y § 8): su código vigente, la reserva del celular que lo leyó y a quién avisarle por
// el canal. Duran lo que dura su canal, uno solo por pantalla; la que no lo abre en 30 s se libera.
import { randomBytes } from 'node:crypto';
import type { Clock } from '../../../../platform/clock.ts';
import { codeSettings } from '../../settings.ts';

export type ScreenEvent =
  | { type: 'code'; code: string }
  | { type: 'read' }
  | { type: 'cancelled' }
  | { type: 'approved'; permit: string };

export type Reservation = { secret: string; challenge: string; until: number };

// El canal abierto de una pantalla: si se abre otro, este se corta.
export type Channel = { stop: () => void };

export type Screen = {
  id: string;
  // El dispositivo y la pestaña que la abrió, si los dijo: recargar la reemplaza.
  owner?: string;
  ipAddress: string;
  deviceLabel: string;
  openedAt: number;
  channel?: Channel;
  code?: string;
  reservation?: Reservation;
  notify?: (event: ScreenEvent) => void;
};

type CodeEntry = { screenId: string; expiresAt: number; read: boolean };
const random = (bytes: number) => randomBytes(bytes).toString('base64url');

type State = { screens: Map<string, Screen>; codes: Map<string, CodeEntry>; now: () => number };

// Abrir, buscar y cerrar pantallas.
function registry({ screens, now }: State) {
  // Las que nunca abrieron su canal (se cortó la red entre los dos pedidos, o nadie lo pidió).
  const sweep = () => {
    for (const [id, screen] of screens)
      if (!screen.channel && screen.openedAt + codeSettings.listenWithinMs <= now())
        screens.delete(id);
  };
  return {
    // Una pantalla nueva, o undefined si se llegó al tope total o al de esa dirección.
    open(ipAddress: string, deviceLabel: string, owner?: string): Screen | undefined {
      sweep();
      const fromIp = [...screens.values()].filter(
        (screen) => screen.ipAddress === ipAddress,
      ).length;
      if (screens.size >= codeSettings.maxScreens || fromIp >= codeSettings.maxScreensPerIp)
        return undefined;
      const screen: Screen = {
        id: random(32),
        ipAddress,
        deviceLabel,
        openedAt: now(),
        ...(owner && { owner }),
      };
      screens.set(screen.id, screen);
      return screen;
    },
    get: (id: string) => screens.get(id),
    close: (id: string) => void screens.delete(id),
    // La pantalla que abrió antes la misma pestaña, si sigue abierta.
    ownedBy: (owner: string) => [...screens.values()].find((screen) => screen.owner === owner),
    // Al reemplazarla: se corta su canal y se libera su lugar.
    drop(screen: Screen): void {
      screens.delete(screen.id);
      screen.channel?.stop();
    },
  };
}

// Los códigos de cada pantalla: 128 bits al azar, valen un minuto y sirven una vez (E14, E15).
function codeBook({ screens, codes, now }: State) {
  const sweep = () => {
    for (const [code, entry] of codes)
      if (entry.expiresAt + codeSettings.codeTtlMs < now()) codes.delete(code);
  };
  return {
    newCode(screen: Screen): string {
      sweep();
      const code = random(16);
      codes.set(code, {
        screenId: screen.id,
        expiresAt: now() + codeSettings.codeTtlMs,
        read: false,
      });
      screen.code = code;
      return code;
    },
    // La pantalla del código, si sirve todavía; si no, por qué.
    find(code: string): Screen | 'code-used' | 'code-expired' {
      const entry = codes.get(code);
      const screen = entry && screens.get(entry.screenId);
      if (!entry || !screen || entry.expiresAt <= now() || screen.code !== code)
        return 'code-expired';
      return entry.read ? 'code-used' : screen;
    },
  };
}

// Leer el código lo reserva: nadie más lo puede leer, y solo quien tiene el secreto aprueba o
// cancela (revisión de seguridad, punto 10). Si vence sin huella, la pantalla vuelve al código.
function reservations({ screens, codes, now }: State) {
  return {
    reserve(screen: Screen, challenge: string, holdMs: number): Reservation {
      (codes.get(screen.code as string) as CodeEntry).read = true;
      screen.reservation = { secret: random(24), challenge, until: now() + holdMs };
      return screen.reservation;
    },
    byReservation: (secret: string): Screen | undefined =>
      [...screens.values()].find(
        (screen) => screen.reservation?.secret === secret && screen.reservation.until > now(),
      ),
    release: (screen: Screen) => void delete screen.reservation,
    expireReservation(screen: Screen): boolean {
      if (!screen.reservation || screen.reservation.until > now()) return false;
      delete screen.reservation;
      return true;
    },
  };
}

export function createScreens(clock: Clock) {
  const state: State = { screens: new Map(), codes: new Map(), now: () => clock.now().getTime() };
  return { ...registry(state), ...codeBook(state), ...reservations(state) };
}

export type Screens = ReturnType<typeof createScreens>;
