// Espejar lo que tiene un dueño (diseño de 03, § 5; ADR-017): algo que vive fuera de las pantallas y
// que solo cambia el dispositivo que lo tiene, como un archivo que se sube desde uno. Cada lado pone lo
// suyo en su propio valor con nombre (`<key>.<lado>`), así los dos nunca escriben el mismo y ninguno
// pisa al otro; y lee el del otro. Qué se comparte y qué se hace con lo que llega lo decide quien lo
// usa: esta pieza no sabe de qué se trata, ni cuáles son los lados, ni de qué negocio es.
import type * as z from 'zod/mini';
import { mirror as appMirror, type Json, type Mirror } from './registry.ts';

// Lo que se espeja: cualquier cosa que avise cuando cambia.
type Source<S> = { get(): S; subscribe(listener: (value: S) => void): () => void };

export type ByOwner<S, T extends Json> = {
  // El nombre de los valores: se les suma el lado.
  key: string;
  // Cómo se llama este lado y el otro (en una ferretería, el celular y la computadora).
  sides: { mine: string; other: string };
  // La forma de lo que viaja: lo que llega del otro sin ella no entra.
  schema: z.ZodMiniType<T>;
  // Lo que tiene un lado que no tiene nada (y el otro, hasta que diga algo).
  nothing: T;
  source: Source<S>;
  // Lo de este lado que ve el otro, o lo mismo si nada cambió para él.
  share: (state: S) => T;
  // Lo que llegó del otro lado.
  receive: (shared: T, from: string) => void;
  // El espejo; de arranque, el de la aplicación.
  mirror?: Mirror;
};

// Empieza a espejar; lo que devuelve lo deja de hacer.
export function mirrorByOwner<S, T extends Json>(options: ByOwner<S, T>): () => void {
  const mirror = options.mirror ?? appMirror;
  const { key, sides, schema, nothing, source, share, receive } = options;
  const mine = mirror.register(`${key}.${sides.mine}`, nothing, schema);
  const theirs = mirror.register(`${key}.${sides.other}`, nothing, schema);
  // Solo sale lo que cambió para el otro: un cambio que no se comparte no viaja.
  let last = JSON.stringify(nothing);
  const shareNow = (state: S) => {
    const now = share(state);
    const text = JSON.stringify(now);
    if (text === last) return;
    last = text;
    mine.set(now);
  };
  shareNow(source.get());
  const stopSource = source.subscribe(shareNow);
  const stopTheirs = theirs.subscribe((shared) => receive(shared, sides.other));
  return () => {
    stopSource();
    stopTheirs();
    mine.release();
    theirs.release();
  };
}
