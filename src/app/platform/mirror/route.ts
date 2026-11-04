// La dirección espejada (diseño de 03, § 5.4): viaja solo `{ path, search }`, nunca lo que va después
// del `#` (ahí van los códigos) ni el estado del historial. La que llega del otro entra al historial,
// así «Atrás» funciona en cada uno, y no se vuelve a mandar. La guarda de lo sin guardar la pregunta
// quien navega: el otro tiene lo mismo escrito y aplica sin preguntar.
import * as z from 'zod/mini';
import { navigate, route } from '../router.ts';
import type { Mirror } from './registry.ts';

const place = z.strictObject({
  path: z.string().check(z.regex(/^\/[A-Za-z0-9/_-]{0,200}$/)),
  search: z.string().check(z.maxLength(400), z.regex(/^(\?[^#]*)?$/)),
});
type Place = z.infer<typeof place>;

const placeOf = (): Place => ({ path: route.get().path, search: route.get().search });
const same = (a: Place, b: Place) => a.path === b.path && a.search === b.search;

export function bindRoute(mirror: Mirror): () => void {
  const value = mirror.register('frame.route', placeOf(), place);
  let applying = false;
  const stopLocal = route.subscribe(() => {
    if (!applying && !same(placeOf(), value.get())) value.set(placeOf());
  });
  const stopRemote = value.subscribe((next) => {
    if (same(next, placeOf())) return;
    applying = true;
    navigate(next.path + next.search, { force: true });
    applying = false;
  });
  return () => {
    stopLocal();
    stopRemote();
    value.release();
  };
}
