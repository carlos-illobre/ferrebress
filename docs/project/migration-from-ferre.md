# Guía de migración desde el proyecto anterior

**Este archivo se borra cuando el último capítulo tenga sus reglas aprobadas,** y con él toda
mención del proyecto anterior en la documentación. Es el único documento que lo nombra: el resto de
la documentación se entiende sin él.

El proyecto anterior está en el repositorio [`ferre`](https://github.com/carlos-illobre/ferre). Se
usa solo para leer: no se modifica.

## Cómo se usa

- **El analista de negocio** (paso 1) lee lo que el proyecto anterior decía del módulo, dice qué se
  toma, qué se descarta por desactualizado y qué propone mejorar, y le confirma todo a Carlos.
  Todo se puede cuestionar, también las reglas.
- **Lo que se toma se reescribe acá,** completo y sin enlaces al proyecto anterior.
- **La documentación del proyecto anterior tiene partes desactualizadas.** Ante una contradicción
  entre una especificación y una decisión posterior, vale la decisión, y se confirma con Carlos.

## Dónde está cada cosa en el proyecto anterior

| Qué | Dónde |
|---|---|
| Índice de requerimientos | `specs/README.md` |
| Decisiones de Carlos (1 a 167) | `docs/decisiones-de-negocio.md` |
| Preguntas abiertas (el analista las hace de nuevo al llegar a cada módulo; por ejemplo, P9 de Acceso: ¿se puede salir sin conexión?) | `specs/preguntas-abiertas.md` |
| Requerimientos no funcionales | `specs/001-base-del-sistema/spec.md` |
| Lenguaje visual «Mostrador» | `docs/lenguaje-mostrador/` |
| Maquetas (v1 a v4) | `microservices/web/public/maquetas/`, publicadas en https://carlos-illobre.github.io/ferre/pruebas/v2/ |
| La pantalla de entrada | `microservices/web/src/pantallas/{celular,compu}/entrada/` |
| Director de arte | `.claude/skills/director-de-arte/` |
| Revisor | `.claude/agents/revisor.md` |

## De dónde viene cada capítulo

| Capítulo | Carpetas de `specs/` |
|---|---|
| 00 · La aplicación | 001, 012, 020 |
| 01 · Entrar | 007 (RF-70, RF-70b, RF-76), 029 |
| 02 · Personas | 007 (RF-72, RF-74, RF-75), 029 |
| 03 · Celular y computadora | 002 (RF-08, RF-09), 007 (RF-77), 023, 025 |
| 04 · Configuración del dispositivo | 009 |
| 05 · Quién hizo qué | 007 (RF-71), 027 |
| 06 · Administración | 020, 005 (RF-59), 014 |
| 07 · Catálogo | 002, 015, 016 |
| 08 · Listas de precios | 002 (RF-01 a RF-04) |
| 09 · Stock | 005 (RF-53, RF-59) |
| 10 · Vender | 003, 017, 019 |
| 11 · Compras | 005 (RF-50 a RF-56) |
| 12 · Mejoras y errores | 008, 028 |
| 13 · Clientes | 004 |
| 14 · Números del negocio | 006, 013 |
| 15 · Sin conexión | 018, 014 |
| 16 · Conteos | 005 (RF-52, RF-58) |
| 17 · Procesos | 011 |

## Lo que ya se sabe que está desactualizado

Encontrado al analizarla el 2026-10-26; el analista lo confirma con Carlos al llegar a cada módulo.

- El aviso de «no es múltiplo de $1.000» del precio a mano se sacó (decisión 132 de la primera
  versión), pero sigue escrito en 003 y 004.
- La búsqueda sin conexión con el catálogo guardado en el dispositivo se reemplazó (decisión 129),
  pero sigue en 002 y 003.
- Los roles `dueño`, `admin` y `mostrador` y la regla «todos son Administrador» siguen en varios
  contratos y en 005, 006 y 007, aunque se reemplazaron por roles armables (decisión 50).
- La entrada por QR figura como quitada en 007, aunque volvió (decisión 57).
- El vínculo del celular figura con 12 horas en el modelo de datos; se pasó a 30 días.
- Corregir, cambiar y devolver: 003 dice que no se puede; 019 y las decisiones 124 y 135 sí.
- El modelo de datos de 001 está al día solo hasta la migración 0011.
- Las preguntas abiertas tienen respuestas que no se borraron de la lista.

## Pantallas que hay que traer

- La entrada, tal como se ve hoy en el celular y en la computadora (decisión 6).
- Las maquetas v2 de cada pantalla, como referencia para el director de arte.
