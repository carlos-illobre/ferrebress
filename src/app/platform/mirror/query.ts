// Lo que una pantalla trae del servidor, espejado (diseño de 03, § 5.3): `forward` es un pedido igual
// en los dos, que por el directo pide solo el que manda y el otro recibe por el Wi-Fi (si a los 3 s no
// llegó, lo pide él); `refetch` depende del dispositivo o del permiso, y cada uno pide el suyo. Por el
// servidor, todo es `refetch`: reenviar una respuesta gasta más que pedirla. Lo que el que sigue pide
// él no viaja. Sin espejo, es pedir y guardar.
import { useEffect, useRef, useState } from 'preact/hooks';
import * as z from 'zod/mini';
import type { ApiResult } from '../server/api.ts';
import { type Json, mirror } from './registry.ts';
import { useMirrored } from './use-mirrored.ts';

export type QueryMode = 'forward' | 'refetch';
export const followerWaitMs = 3000;

// Si este dispositivo pide él, y si lo que trae viaja al otro.
function role(mode: QueryMode) {
  const port = mirror.port();
  if (!port) return { asks: true, travels: true };
  const forwarded = mode === 'forward' && port.over === 'direct';
  return { asks: port.leader || !forwarded, travels: forwarded && port.leader };
}

export function useMirroredQuery<T extends Json>(
  key: string,
  request: () => Promise<ApiResult<T>>,
  deps: unknown[],
  { mode, schema }: { mode: QueryMode; schema: z.ZodMiniType<T> },
) {
  const [data, setData] = useMirrored<T | null>(`q:${key}`, null, z.nullable(schema));
  const [failed, setFailed] = useState(false);
  const [round, setRound] = useState(0);
  // Lo último que se tiene: el que sigue mira si llegó algo nuevo mientras esperaba.
  const latest = useRef(data);
  latest.current = data;

  useEffect(() => {
    let current = true;
    const ask = async () => {
      const result = await request();
      if (!current) return;
      setFailed(!result.ok);
      if (result.ok) setData(result.data, role(mode).travels ? undefined : { auto: true });
    };
    if (role(mode).asks) {
      void ask();
      return () => {
        current = false;
      };
    }
    // El que sigue espera lo que trae el que manda; si a tiempo no llegó nada nuevo, pide él.
    const waited = latest.current;
    const timer = setTimeout(() => {
      if (latest.current === waited) void ask();
    }, followerWaitMs);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [...deps, round]);

  return {
    data: data ?? undefined,
    failed,
    // Lo que cambió con una escritura (la respuesta de un POST): viaja como cualquier cambio.
    update: (change: (now: T) => T) => {
      if (data !== null) setData(change(data));
    },
    invalidate: () => setRound((n) => n + 1),
  };
}
