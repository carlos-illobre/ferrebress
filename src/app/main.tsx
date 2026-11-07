// Monta la aplicación en la página, prende el teclado de la computadora y registra el service worker
// (platform/offline), que permite instalarla y abrirla sin conexión. En desarrollo no hay sw.js.
import { render } from 'preact';
import './styles/tokens.css';
import './styles/base.css';
import { App } from './App.tsx';
import { watchPreferences } from './modules/device-settings/index.ts';
import { watchInstall } from './platform/install.ts';
import { startKeyboard } from './platform/keyboard.ts';
import { watchMotion } from './platform/motion.ts';

// Antes de dibujar: el movimiento, para que nada arranque y se corte, y el aviso del navegador de que
// se puede instalar, que llega una sola vez y temprano (diseño de 04, § 4).
watchMotion();
watchPreferences();
watchInstall();
startKeyboard();
render(<App />, document.getElementById('app') as HTMLElement);
// Como módulo: el armado le comparte código con la aplicación (`import`), que un service worker
// común no puede cargar. Si no se puede registrar (un navegador que no lo permite), la aplicación
// anda igual, sin guardarse.
if (import.meta.env.PROD && 'serviceWorker' in navigator)
  navigator.serviceWorker.register('/sw.js', { type: 'module' }).catch(() => undefined);
