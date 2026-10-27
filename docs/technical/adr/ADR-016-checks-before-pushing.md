# ADR-016: Qué controla `pnpm check` y con qué herramientas

**Estado:** propuesto

## Contexto

Antes de subir, un solo comando tiene que decir si el cambio cumple las reglas del código: tipos,
formato, tamaño, complejidad, qué puede importar a qué, código repetido, pruebas con su cobertura y
enlaces de la documentación. Tiene que ser rápido (se corre en cada subida), con pocas herramientas
y la misma configuración en la máquina de quien programa y en GitHub.

## Decisión

| Qué | Con qué | Límite |
|---|---|---|
| Tipos | `tsc --build`, modo estricto | Sin errores |
| Formato y reglas del código | Biome (un solo programa, escrito en Rust) | Sin avisos |
| Tamaño | Biome: líneas por función; un control propio para las líneas por archivo | 40 líneas por función, 250 por archivo |
| Complejidad | Biome, `noExcessiveCognitiveComplexity` | 10 por función |
| Qué puede importar a qué | dependency-cruiser | Las reglas de la arquitectura: un módulo solo usa la fachada de otro, `platform` no importa módulos, `app` y `server` solo comparten `shared`, ningún módulo importa un adaptador, sin ciclos |
| Código repetido | jscpd | Ningún bloque de 8 líneas o más repetido |
| Pruebas y cobertura | Vitest | 100 % de líneas y ramas (ADR-005) |
| Peso de la aplicación | Un control propio sobre lo que construye Vite | Lo que diga el diseño de cada módulo |
| Enlaces de `docs/` | Un control propio en `tools/`, sin dependencias | Ninguno roto |
| Dependencias con fallas conocidas | `pnpm audit --prod` | Ninguna alta o crítica |
| Secretos en lo que se sube | secretlint, con sus reglas recomendadas | Ninguno |

- **Las pruebas de punta a punta** no son parte de `pnpm check`: corren antes de cerrar un módulo.
- **GitHub corre lo mismo** en cada subida (`check.yml`).
- **Una excepción** a un límite se escribe en la configuración con un comentario que dice por qué;
  el revisor de código las mira todas.

## Opciones descartadas

- **ESLint con Prettier:** lo más usado, con más reglas y complementos, pero son dos herramientas,
  decenas de paquetes y varias veces más lento. Biome tiene las reglas que hacen falta.
- **Las reglas de importación de ESLint** en lugar de dependency-cruiser: obliga a tener ESLint.
- **Sin control de código repetido:** el principio de reutilizar queda sin nada que lo haga
  cumplir.
- **gitleaks** para los secretos: más completo, pero es un programa aparte que no se instala con
  pnpm.
- **Un servicio externo** de calidad de código: suma una cuenta y manda el código afuera, para lo
  que ya hacen estas herramientas en la máquina.

## Consecuencias

- Son cinco herramientas de terceros (Biome, dependency-cruiser, jscpd, secretlint y Vitest) y dos controles
  propios chicos.
- Los números de los límites salen de la constitución (funciones cortas, baja complejidad); si un
  límite molesta sin sentido, se cambia acá con la aprobación de Carlos.
