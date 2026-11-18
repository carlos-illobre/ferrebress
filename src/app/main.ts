// Arranca la aplicación (ADR-019, ADR-020): lo que tiene que estar antes de dibujar, las capas
// enchufables, la vista elegida y el service worker (platform/offline), que permite instalarla y
// abrirla sin conexión. En desarrollo no hay sw.js.
import { h, render } from 'preact';
import { watchAnomalies } from './modules/anomalies/index.ts';
import { watchPreferences } from './modules/device-settings/index.ts';
import { watchUploads } from './modules/price-lists/index.ts';
import { watchInstall } from './platform/install.ts';
import { watchMotion } from './platform/motion.ts';
import { App } from './views/index.ts';

// Antes de dibujar: el movimiento, para que nada arranque y se corte, y el aviso del navegador de que
// se puede instalar, que llega una sola vez y temprano (diseño de 04, § 4).
watchMotion();
watchPreferences();
watchInstall();
// Cuántas anomalías hay abiertas, para el menú (06 · R9.5).
watchAnomalies();
// Las listas que se suben, espejadas con el otro dispositivo (08 · R1.6).
watchUploads();
// Las capas enchufables (ADR-020) se encuentran solas: cada carpeta con un index.ts que exporta start.
const layers = import.meta.glob<{ start: () => unknown }>('./keyboard/*/index.ts', { eager: true });
for (const layer of Object.values(layers)) layer.start();
render(h(App, null), document.getElementById('app') as HTMLElement);
// Como módulo: el armado le comparte código con la aplicación (`import`), que un service worker
// común no puede cargar. Si no se puede registrar (un navegador que no lo permite), la aplicación
// anda igual, sin guardarse.
if (import.meta.env.PROD && 'serviceWorker' in navigator)
  navigator.serviceWorker.register('/sw.js', { type: 'module' }).catch(() => undefined);
