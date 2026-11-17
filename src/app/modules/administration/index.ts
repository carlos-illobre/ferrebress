// Administración (capítulo 06): a los demás módulos les da cómo abrir sus pantallas (Lectores vuelve
// a Administración) y el tamaño máximo de una lista. Lo que usan las vistas está en model.ts (ADR-019), y sus pantallas, en cada
// vista (views/<view>/administration/).

export { listMaxMb } from './limits.ts';
export { openAdminPage } from './pages.ts';
