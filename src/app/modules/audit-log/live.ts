// «Actualizar solo» en la aplicación (05 · R4.6, E49 a E56; diseño de 05, § 7.2): el selector, que
// vive en la pantalla (no se guarda ni se espeja); el tema del canal mientras está prendido y las
// fechas incluyen hoy; y qué hacer con cada aviso: arriba de todo, poner la lista al día; más abajo,
// contar las nuevas; con la cinta abierta, esperar a que se cierre. Como mucho una vez cada 5 s.
import { auditLiveTopic } from '@ferrebress/shared/contracts/audit-log';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useLatest } from '../../platform/latest.ts';
import { useRate } from '../../platform/meter.ts';
import { useTopic } from '../../platform/realtime/use-topic.ts';
import type { ApiResult } from '../../platform/server/api.ts';
import { canReach, watchReach } from '../../platform/server/reach.ts';
import { auditLogSettings } from './settings.ts';

// Lo que pasó al pedir: listo, se movió la persona mientras tanto (hay que contar en vez de mostrar),
// o el servidor pidió esperar.
export type Outcome = 'done' | 'moved' | { waitMs: number };

export type LiveOptions = {
  wide: boolean;
  withToday: boolean;
  tapeOpen: boolean;
  // Arriba de todo: la página 1, sin haber bajado.
  atTop: () => boolean;
  // Poner la lista al día sola, o contar las nuevas.
  refresh: () => Promise<Outcome>;
  count: () => Promise<Outcome>;
  // Le sacaron el permiso: pedir algo para que la aplicación se entere (02 · R7.8).
  lost: () => void;
};

// Lo que el servidor dijo de un pedido que salió solo.
export function outcomeOf(result: ApiResult<unknown>): Outcome {
  if (!result.ok && result.error === 'too-many-attempts')
    return { waitMs: Math.max(1, Number(result.retryAfterSeconds) || 60) * 1000 };
  return 'done';
}

// El tema se pide mientras hace falta y se suelta un rato después de que deja de hacer falta.
function useHeld(wanted: boolean): boolean {
  const [held, setHeld] = useState(wanted); // local: la suscripción de esta pestaña
  useEffect(() => {
    if (wanted) return setHeld(true);
    const timer = setTimeout(() => setHeld(false), auditLogSettings.live.releaseMs);
    return () => clearTimeout(timer);
  }, [wanted]);
  return held;
}

// Qué hacer con cada aviso, con lo de ahora (`now`, `wanted`): como mucho una vez cada 5 s; con la
// cinta abierta, al cerrarla; con 429, recién cuando pasa lo que dijo el servidor.
function createNotices(
  now: { current: LiveOptions },
  wanted: { current: boolean },
  latest: ReturnType<typeof useLatest>,
) {
  const live = { last: Number.NEGATIVE_INFINITY, pausedUntil: 0, pending: false };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const stop = () => {
    clearTimeout(timer);
    timer = undefined;
  };
  const run = async () => {
    if (Date.now() < live.pausedUntil) return;
    live.last = Date.now();
    const asked = now.current;
    let outcome = await latest(asked.atTop() ? asked.refresh() : asked.count());
    if (outcome === 'moved') outcome = await latest(now.current.count());
    if (outcome && typeof outcome === 'object') live.pausedUntil = Date.now() + outcome.waitMs;
  };
  const notice = () => {
    if (!wanted.current) return;
    if (now.current.tapeOpen) {
      live.pending = true;
      return;
    }
    const wait = live.last + auditLogSettings.live.everyMs - Date.now();
    if (wait <= 0) return void run();
    // Al cumplirse la espera se vuelve a mirar todo: apagado, oculta o con la cinta, no pide.
    timer ??= setTimeout(() => {
      timer = undefined;
      notice();
    }, wait);
  };
  // Lo que llegó con la cinta abierta, al cerrarla.
  const tapeClosed = () => {
    if (!live.pending) return;
    live.pending = false;
    notice();
  };
  return { run, notice, stop, tapeClosed };
}

export function useLive(options: LiveOptions) {
  const [on, setOn] = useState(options.wide); // local: no se guarda ni viaja (E56)
  const wanted = on && options.withToday;
  // Pedido en cuanto hace falta; soltado un rato después.
  const held = useHeld(wanted) || wanted;
  const now = useRef(options);
  now.current = options;
  const isWanted = useRef(wanted);
  isWanted.current = wanted;
  const latest = useLatest();
  const [notices] = useState(() => createNotices(now, isWanted, latest)); // local: de la pantalla
  useTopic(held ? auditLiveTopic : undefined, {
    onEvent: notices.notice,
    onRefused: (code) => code === 'forbidden' && now.current.lost(),
  });
  // Apagado, oculta o sin conexión, nada queda esperando para pedir.
  useEffect(() => (wanted ? undefined : notices.stop()), [wanted]);
  useEffect(() => {
    const off = watchReach(() => !canReach() && notices.stop());
    return () => {
      off();
      notices.stop();
    };
  }, []);
  useEffect(() => (options.tapeOpen ? undefined : notices.tapeClosed()), [options.tapeOpen]);
  const rate = useRate(auditLiveTopic);
  return {
    on,
    shown: options.withToday,
    // Lo que gasta esta pantalla: apagado, 0 en el momento (R4.12).
    rate: on ? rate : 0,
    toggle() {
      const next = !on;
      setOn(next);
      // Prenderlo es un toque: con el tema todavía pedido no llega el aviso del alta, y se pide ya.
      if (next && held) void notices.run();
    },
  };
}

export type Live = ReturnType<typeof useLive>;
