# Arquitectura

Cómo está armado el sistema por dentro. El porqué de cada decisión está en los
[ADR](adr/README.md); el diseño de cada módulo, en [modules/](modules/README.md). Esta página no
tiene reglas del negocio: esas están en los [capítulos](../chapters/README.md).

## Las piezas

```
                    ┌──────────────────────────────┐
  celular ─┐        │  Caddy (HTTPS, una sola      │
           ├─HTTP──▶│  puerta, sirve la aplicación)│
  compu  ──┘        └──────────────┬───────────────┘
     ▲                             │
     │ conexión directa            ▼
     │ (Wi-Fi del local)   ┌───────────────┐    ┌──────────────┐
     └─────────────────────│  server (Node)│───▶│ PostgreSQL   │  el presente
                           │  un proceso,  │    └──────────────┘
                           │  un módulo por│    ┌──────────────┐
                           │  capítulo     │───▶│ SQLite       │  la auditoría
                           └───────────────┘    └──────────────┘
```

Tres contenedores: Caddy, el servidor y PostgreSQL. La auditoría es un archivo del servidor.

## El código

```
src/
├── shared/          TypeScript puro que usan el servidor y la aplicación
│   ├── pricing/     costo, margen, precio, redondeo y su explicación
│   ├── money/       pesos y cantidades
│   └── contracts/   la forma de lo que entra y sale por la API, por módulo
├── server/
│   ├── main.ts      arma el servidor: registra cada módulo
│   ├── platform/    tecnología sin negocio: db, audit, http, session, permissions,
│   │                events, realtime, config, clock
│   └── modules/<module>/
└── app/
    ├── main.tsx     arma la aplicación: registra cada módulo
    ├── platform/    tecnología sin negocio: api, realtime, storage, offline, camera,
    │                keyboard, router, clock
    ├── ui/          las piezas del lenguaje visual (Button, Sheet, Table…), sin estilos
    │                de pantalla
    ├── styles/      los tokens del lenguaje visual (colores, letra, medidas) y el marco
    └── modules/<module>/
```

`src/` no tiene reglas que no estén en `docs/`. Cada módulo puede tener un `README.md` corto que
explique su código y enlace su diseño en `docs/technical/modules/`.

## Un módulo del servidor

Siempre los mismos archivos, así quien abrió uno sabe dónde está cada cosa en todos:

| Archivo | Qué hace | Qué no hace |
|---|---|---|
| `index.ts` | La fachada: lo único que pueden usar los otros módulos, y el registro del módulo (rutas, permisos, eventos que escucha) | No tiene lógica propia |
| `routes.ts` | La entrada HTTP: valida con el contrato, mira el permiso, llama a la regla y responde | No decide nada del negocio ni toca la base |
| `rules.ts` | La regla del negocio: qué se puede, qué se calcula, en qué orden | No importa tecnología: ni el framework web ni la base |
| `data.ts` | Las consultas a las tablas de su esquema, siempre en lote | No decide: guarda y lee lo que le piden |
| `events.ts` | Los eventos que publica, con su texto para la auditoría | |
| `migrations/` | Las migraciones de su esquema | |

Si un archivo crece, se parte por responsabilidad con el mismo nombre en plural de carpeta
(`rules/charge.ts`, `rules/void.ts`).

La dirección es siempre `routes → rules → data`. Entre módulos, solo por `index.ts`, sin ciclos.
Una transacción puede abarcar varios módulos: quien la abre se la pasa a la fachada del otro, que
escribe solo sus tablas (ADR-001).

## Un módulo de la aplicación

| Archivo | Qué hace |
|---|---|
| `index.ts` | El registro: sus rutas, su lugar en el menú, sus acciones de teclado y lo que baja para trabajar sin conexión |
| `api.ts` | Las llamadas al servidor del módulo, una sola vez |
| `state.ts` | La máquina de estados del proceso (la venta en curso, el ingreso): acciones con nombre y un reductor puro |
| `texts.ts` | Los textos en castellano |
| `use<Thing>.ts` | La lógica de una pantalla, sin HTML |
| `screens/<Screen>/<Screen>.tsx` | El HTML semántico de la pantalla, sin lógica |
| `screens/<Screen>/<Screen>.css` | Su estilo, para el celular y la computadora, con media queries |

Las pantallas usan solo los tokens de `styles/` y las piezas de `ui/`: cambiar la estética es
tocar CSS (ADR-002). Cada módulo se baja recién cuando se abre.

**Las acciones con nombre son la columna de la aplicación.** Todo lo que hace la persona
(agregar un renglón, cambiar de pantalla, cobrar) es una acción que pasa por un solo punto. Ese
punto permite enchufar sin que los módulos lo sepan: el espejo del celular la manda al otro
dispositivo (ADR-003), el teclado la dispara desde una tecla y la cola sin conexión la guarda
(ADR-007).

## Las conexiones

Un solo módulo, `realtime`, con cuatro formas de conectarse. Cada funcionalidad declara qué
necesita y el módulo elige cómo (ADR-003):

| Forma | Para qué | Cómo | Prioriza |
|---|---|---|---|
| `request` | Todo lo normal | HTTP | — |
| `piggyback` | Lo continuo: versión nueva, luz de conexión, sesión cerrada, avisos pendientes | En una cabecera de las respuestas que ya se hacen; sin conexión abierta | Bajo consumo |
| `temporary` | Esperar algo puntual: el QR de entrada, la foto del celular, el avance de una lista | SSE abierto solo mientras se espera y la pantalla está a la vista | Tiempo real |
| `peer` | Celular y computadora vinculados | Conexión directa por el Wi-Fi (WebRTC); el servidor solo los presenta y hace de respaldo | Tiempo real sin servidor |

## Los datos

- **PostgreSQL**, una base con un esquema por módulo. Solo el estado actual; lo que deja de valer
  se borra. Cada módulo es dueño de su esquema.
- **SQLite para la auditoría**, un archivo por año, escrito por tandas (ADR-004).
- **En el dispositivo**, solo si habilitó trabajar sin conexión: lo justo para atender y la cola
  de lo pendiente, en IndexedDB (ADR-007). Si no lo habilitó, solo lo que no es del negocio ni
  secreto, en `localStorage`: el identificador del dispositivo, sus preferencias, el nombre y rol de
  quien entró y una salida pendiente.
- **Los identificadores** los genera quien crea el dato (UUID v7, ordenables por tiempo), así lo
  que se repite no se duplica.
- **La hora** la pone el servidor (ADR-007).

## Escala

Hoy un proceso alcanza de sobra. Si algún día hacen falta varias copias del servidor, cambian
tres piezas de `platform/`, sin tocar el negocio: las sesiones (de la memoria a la base), la
central de avisos (de la memoria a `LISTEN/NOTIFY` de PostgreSQL) y la auditoría (un solo
escritor).

## Controles en `pnpm check`

- Tipos de TypeScript estrictos.
- Qué puede importar a qué: entre módulos solo por la fachada; `rules.ts` sin tecnología;
  `platform/` sin negocio; `shared/` sin nada de afuera.
- Complejidad, tamaño de archivo y de función, y código repetido, como aviso con límites que se
  fijan al armar la base.
- Pruebas unitarias con cobertura del 100 % (ADR-005).
- Los enlaces de `docs/` funcionan.
