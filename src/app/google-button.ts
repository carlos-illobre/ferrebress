// Arranca el marco del botón de Google (modules/sign-in/google/page/frame.ts) en su página.
import './modules/sign-in/google/page/frame.css';
import { startGoogleFrame } from './modules/sign-in/google/page/frame.ts';

startGoogleFrame(document.getElementById('google-button') as HTMLElement, window.parent);
