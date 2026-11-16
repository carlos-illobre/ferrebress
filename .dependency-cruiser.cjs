// Qué puede importar a qué (ADR-016, arquitectura).
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    { name: 'sin-ciclos', severity: 'error', from: {}, to: { circular: true } },
    {
      name: 'app-y-server-solo-comparten-shared',
      severity: 'error',
      from: { path: '^src/(app|shared)/' },
      to: { path: '^src/server/' },
    },
    {
      name: 'server-no-importa-la-app',
      severity: 'error',
      from: { path: '^src/(server|shared)/' },
      to: { path: '^src/app/' },
    },
    {
      name: 'shared-sin-nada-de-afuera',
      severity: 'error',
      from: { path: '^src/shared/' },
      to: { dependencyTypes: ['npm', 'core'], pathNot: '/node_modules/zod/' },
    },
    {
      // Las capas que sirven para otros proyectos (ADR-020) no saben nada de Ferrebress.
      name: 'paquetes-sin-la-aplicacion',
      severity: 'error',
      from: { path: '^packages/' },
      to: { path: '^src/' },
    },
    {
      name: 'platform-sin-negocio',
      severity: 'error',
      from: { path: '^src/(server|app)/platform/' },
      to: { path: '^src/(server|app)/modules/' },
    },
    {
      name: 'entre-modulos-solo-la-fachada',
      severity: 'error',
      from: { path: '^src/(server|app)/modules/([^/]+)/' },
      to: {
        path: '^src/$1/modules/([^/]+)/',
        pathNot: ['^src/$1/modules/$2/', '^src/$1/modules/[^/]+/index\\.tsx?$'],
      },
    },
    {
      name: 'nadie-importa-un-adaptador',
      severity: 'error',
      from: { pathNot: ['^src/server/main\\.ts$', '^src/server/adapters/'] },
      to: { path: '^src/server/adapters/' },
    },
    // La vista separada de la lógica (ADR-019): la lógica no conoce ninguna vista, ni sus piezas.
    {
      name: 'la-logica-no-importa-vistas',
      severity: 'error',
      from: { path: '^src/app/(modules|platform|shell)/', pathNot: '-kit\\.tsx$' },
      to: { path: ['^src/app/(views|ui|styles)/', '\\.(tsx|css)$'] },
    },
    {
      name: 'la-vista-solo-usa-el-modelo',
      severity: 'error',
      from: { path: '^src/app/views/', pathNot: 'kit\\.tsx$' },
      to: { path: '^src/app/modules/', pathNot: '^src/app/modules/[^/]+/model\\.ts$' },
    },
    {
      // De la plataforma, la vista usa solo su contrato (platform/view).
      name: 'la-vista-solo-usa-el-contrato',
      severity: 'error',
      from: { path: '^src/app/views/', pathNot: 'kit\\.tsx$' },
      to: { path: '^src/app/platform/', pathNot: '^src/app/platform/view/' },
    },
    {
      // Las capas del teclado se encuentran solas (ADR-020): nadie las importa.
      name: 'nadie-importa-el-teclado',
      severity: 'error',
      from: { path: '^src/app/', pathNot: ['^src/app/keyboard/', '^src/app/testing/'] },
      to: { path: ['^src/app/keyboard/', '^src/app/modules/[^/]+/shortcuts/'] },
    },
    {
      name: 'reglas-sin-tecnologia',
      severity: 'error',
      from: { path: '/rules\\.ts$' },
      to: { dependencyTypes: ['npm', 'core'] },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '\\.test\\.tsx?$' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.base.json' },
  },
};
