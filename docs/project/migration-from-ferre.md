# Guía de migración desde la primera versión

**Este archivo se borra cuando Ferrebress esté terminado,** junto con la primera versión. Es el
único documento que la nombra (decisión 31): el resto de la documentación se entiende sin ella.

La primera versión está en el repositorio [`ferre`](https://github.com/carlos-illobre/ferre). Se
usa solo para leer: no se modifica.

## Cómo se usa

- **El analista de negocio** (paso 1) lee lo que la primera versión decía del módulo, dice qué se
  toma, qué se descarta por desactualizado y qué propone mejorar, y le confirma todo a Carlos.
  Todo se puede cuestionar, también las reglas.
- **Lo que se toma se reescribe acá,** completo y sin enlaces a la primera versión.
- **La documentación de la primera versión tiene partes desactualizadas.** Ante una contradicción
  entre una especificación y una decisión posterior, vale la decisión, y se confirma con Carlos.

## Dónde está cada cosa en la primera versión

| Qué | Dónde |
|---|---|
| Índice de requerimientos | `specs/README.md` |
| Decisiones de Carlos (1 a 167) | `docs/decisiones-de-negocio.md` |
| Preguntas abiertas | `specs/preguntas-abiertas.md` |
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
| 01 · Acceso | 007, 029 |
| 02 · Celular y computadora | 002 (RF-08, RF-09), 007 (RF-77), 023, 025 |
| 03 · Configuración del dispositivo | 009 |
| 04 · Quién hizo qué | 007 (RF-71), 027 |
| 05 · Administración | 020, 005 (RF-59), 014 |
| 06 · Catálogo | 002, 015, 016 |
| 07 · Listas de precios | 002 (RF-01 a RF-04) |
| 08 · Stock | 005 (RF-53, RF-59) |
| 09 · Vender | 003, 017, 019 |
| 10 · Compras | 005 (RF-50 a RF-56) |
| 11 · Mejoras y errores | 008, 028 |
| 12 · Clientes | 004 |
| 13 · Números del negocio | 006, 013 |
| 14 · Sin conexión | 018, 014 |
| 15 · Conteos | 005 (RF-52, RF-58) |
| 16 · Procesos | 011 |

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
