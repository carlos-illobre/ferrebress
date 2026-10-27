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
