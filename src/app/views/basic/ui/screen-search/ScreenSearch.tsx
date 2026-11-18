// El buscador de una pantalla: filtra mientras se escribe, se alcanza con
// «/» y se borra con Esc. Igual en Catálogo → Listas y en Lectores.
import type { Words } from '../../../../platform/view/words.ts';
import { addShapes, Icon } from '../icon/Icon.tsx';
import { peopleShapes } from '../icon/people-shapes.tsx';
import { Search } from '../search/Search.tsx';

addShapes({ search: peopleShapes.search });

type Props = {
  look: string;
  words: Words;
  view: { search: string; setSearch: (text: string) => void };
};

export function ScreenSearch({ look, words, view }: Props) {
  return (
    <Search
      look={look}
      icon={<Icon name="search" size="small" />}
      placeholder={words}
      aria-label={words.long}
      value={view.search}
      onText={view.setSearch}
      data-slash=""
      data-clear=""
    />
  );
}
