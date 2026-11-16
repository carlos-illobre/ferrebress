// El modelo de la pantalla del manual (ADR-019): lo que arma useManual, ya cargado, con cómo se ve
// (el celular angosto muestra el paso a paso y «Todos los pasos» como hojas) y «Volver», que cierra
// antes las hojas abiertas en el celular (cada una es un paso atrás). Se anuncia para las capas: el
// manual, y «Todos los pasos» encima mientras está abierto.
import type { Device } from '@ferrebress/shared/contracts/manual';
import { useScreen } from '../../platform/screens.ts';
import type { Back } from './place/back.ts';
import { useManual } from './useManual.ts';
import type { View } from './view.ts';

// Las hojas abiertas en el celular: «Volver» las cierra antes de salir.
const openSheets = (view: View) =>
  view.narrow ? Number(view.state.sheet) + Number(view.state.allSteps) : 0;

export function useManualScreen(device: Device, narrow: boolean, back: Back) {
  const manual = useManual(device, narrow);
  const { index, state } = manual;
  const view: View | undefined =
    typeof index === 'object' && state ? { ...manual, index, state, narrow } : undefined;
  const model = {
    view,
    // undefined mientras baja el índice; true si no se pudo bajar (sin conexión o falta).
    failed: index !== undefined && !view,
    back,
    // Solo con el manual cargado: sin él, «Volver» es back.go(0).
    goBack: () => back.go(openSheets(view as View)),
  };
  useScreen('manual', model, !!view);
  useScreen('manual-all-steps', model, !!view?.state.allSteps);
  return model;
}

export type ManualScreen = ReturnType<typeof useManualScreen>;
