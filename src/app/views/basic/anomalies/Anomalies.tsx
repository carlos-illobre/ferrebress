// Más → Administración → Anomalías (06 · pantalla 2, R9): las del filtro, de la más nueva a la más
// vieja, cada una con su tipo, cuándo pasó y de qué se trata; Enter o un toque abre su detalle. Una
// sola pantalla para los dos anchos. Se baja recién al abrirla (AnomaliesSlot).
import {
  type AnomalyView,
  linesOf,
  texts,
  useAnomalies,
  type Anomalies as View,
} from '../../../modules/anomalies/model.ts';
import { MoreCrumb } from '../frame/index.ts';
import { Stale } from '../price-lists/Stale.tsx';
import { deviceSettingsShapes } from '../ui/icon/device-settings-shapes.tsx';
import { addShapes, Icon } from '../ui/icon/Icon.tsx';
import { peopleShapes } from '../ui/icon/people-shapes.tsx';
import { rolesShapes } from '../ui/icon/roles-shapes.tsx';
import { LoadState } from '../ui/load-state/LoadState.tsx';
import { Say } from '../ui/say/Say.tsx';
import { Detail } from './Detail.tsx';
import { Filters } from './Filters.tsx';
import './Anomalies.css';

addShapes({
  'chevron-left': peopleShapes['chevron-left'],
  'chevron-up': rolesShapes['chevron-up'],
  'chevron-down': rolesShapes['chevron-down'],
  'rotate-ccw': deviceSettingsShapes['rotate-ccw'],
});

function Item({ view, anomaly }: { view: View; anomaly: AnomalyView }) {
  const lines = linesOf(anomaly);
  const open = view.isOpen(anomaly);
  return (
    <li
      class="anomaly"
      onFocusCapture={() => view.choose(anomaly.id)}
      aria-current={view.chosen === anomaly.id || undefined}
    >
      <button
        type="button"
        class="anomaly-head"
        data-mark=""
        aria-expanded={open}
        aria-label={`${lines.kind}: ${open ? texts.close : texts.open}`}
        onClick={() => view.toggle(anomaly.id)}
      >
        <Icon name="triangle-alert" />
        <span class="anomaly-text">
          <b>{lines.kind}</b>
          <span>
            {lines.supplier}
            {lines.file && ` · ${lines.file}`}
          </span>
          {lines.detail && <span>{lines.detail}</span>}
          <small>{lines.state ?? lines.when}</small>
        </span>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size="small" />
      </button>
      {open && <Detail view={view} anomaly={anomaly} />}
    </li>
  );
}

function Body({ view }: { view: View }) {
  if (!view.data)
    return (
      <LoadState look="anomalies-loading" failed={view.failed} texts={texts} retry={view.retry} />
    );
  return (
    <div class={view.live ? '' : 'anomalies-stale'}>
      <Stale screen="anomalies" view={view} texts={texts} />
      {view.anomalies.length === 0 ? (
        <p class="anomalies-empty">{view.emptyText}</p>
      ) : (
        <ul class="anomalies-list">
          {view.anomalies.map((anomaly) => (
            <Item key={anomaly.id} view={view} anomaly={anomaly} />
          ))}
        </ul>
      )}
      {view.data.next && view.live && (
        <button
          type="button"
          class="lists-button anomaly-more"
          data-mark=""
          onClick={() => void view.more()}
        >
          {texts.more}
        </button>
      )}
    </div>
  );
}

export function Anomalies() {
  const view = useAnomalies();
  return (
    <div class="anomalies">
      <header class="anomalies-head">
        <MoreCrumb name={texts.title} parent={{ name: texts.parent, open: view.back }} />
        <h1>{texts.title}</h1>
        <p class="anomalies-about">
          <Say words={texts.about} />
        </p>
        <Filters view={view} />
      </header>
      <Body view={view} />
    </div>
  );
}
