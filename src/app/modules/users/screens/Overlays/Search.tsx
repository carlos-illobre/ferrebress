// Buscar en el celular (pedido de Carlos): un diálogo como el de autorizar, con la caja para buscar
// y los filtros; la lista de atrás cambia mientras se escribe. «Limpiar» saca todo.
import { Button } from '../../../../ui/button/Button.tsx';
import { Dialog } from '../../../../ui/dialog/Dialog.tsx';
import { useUsersContext } from '../../state.ts';
import { dialogTexts as d, texts } from '../../texts.ts';
import { Chips, SearchBox } from '../Users/Summary.tsx';
import './Overlays.css';

export function Search() {
  const users = useUsersContext();
  const clear = () => {
    users.setSearch('');
    users.setFilter('all');
  };
  return (
    <Dialog label={texts.searchUser} className="users-dialog users-find">
      <h2>{texts.searchUser}</h2>
      <SearchBox />
      <Chips />
      <div class="users-dialog-foot">
        <Button look="plain" doing={texts.searchClear} onPress={clear}>
          {texts.searchClear}
        </Button>
        <Button look="action" doing={d.cancel} onPress={users.close} closes primary>
          {texts.searchDone(users.shown.length)}
        </Button>
      </div>
    </Dialog>
  );
}
