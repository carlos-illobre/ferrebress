# Usuarios · Los roles de una persona: notas del director de arte

Quien administra elige qué roles tiene una persona: al autorizarla y después, desde su tarjeta. Tres
ideas, cada una en la computadora y en el celular con el mismo número. Los datos son ficticios: cinco
roles (Administrador, Encargado de turno, Oficina y personal, Mostrador, Solo mirar), ocho personas,
y quien mira es Rubén Paredes, con Administrador, que entró hace 2 horas (por eso darle un rol a
alguien le pide Google o la huella; quitarlo, no). Lo común a las tres (el marco de Usuarios, la
lista, la tostada, el pedido de confirmar que sos vos) está en `shared/`.

## Las tres variantes

**1 · La tarjeta** (`variant-1-card`): la evolución. La tarjeta aprobada de Usuarios suma la sección
«Roles», con cada rol, su descripción y los íconos de lo que da, y debajo «Con esto puede»: los
permisos que suma la persona y qué rol le da cada uno. «Cambiar roles» (Alt R) vuelve la sección una
lista para tildar (1 a 5), y «Va a poder» muestra en vivo lo que suma (verde) y lo que pierde (rojo)
antes de guardar. Autorizar usa la misma lista, sin nada tildado, con «Va a poder» al costado. En el
celular, la tarjeta entra como página y la lista sube como hoja. Arriba de la lista, el filtro por
rol con cuántas personas lo tienen. Ideas: 1, 2, 3, 4, 5, 6, 7, 8, 9.

**2 · Lo que puede hacer** (`variant-2-abilities`): la reinvención. No se eligen roles: se contesta
«¿Qué puede hacer Martín?» con cinco fichas con interruptor, una por permiso, y la pantalla deduce
qué roles le tocan («Eso es: Encargado de turno», con lo que deja de tener tachado). Si ningún rol da
justo eso, lo dice y ofrece el más cercano con lo que deja de más, o armar un rol así en Roles. La
otra forma: «Igual que alguien», un toque en otra persona copia sus roles. Al autorizar, esa
pregunta va primero: el caso común (otro cajero como Pedro) es un toque. Ideas: 3, 4, 5, 6, 7, 8,
10, 11, 12, 13.

**3 · El llavero** (`variant-3-keyring`): la que nadie se animaría. La persona es un llavero colgado
de su etiqueta; cada rol, una llave de metal en el tablero. Darle un rol es arrastrar una copia de la
llave al llavero (como en el mostrador de copias de la ferretería; el tablero cuenta las copias);
sacárselo, arrastrarla afuera y se cae. La última llave no sale: tiembla y dice por qué. Debajo, las
puertas que abre el llavero. Autorizar no abre un diálogo: aparece un llavero vacío con la etiqueta
para escribir el nombre y el correo. En el celular, las llaves esperan en una bandeja abajo y se
suben con el pulgar o se tocan. Ideas: 3, 4, 5, 6, 7, 14, 15, 16, 17, 18.

## La que prefiero: la 1, La tarjeta, con dos ideas de la 2

Los roles son pocos y los arma quien administra en la pestaña Roles: acá la persona solo tiene que
elegir de una lista corta y ver qué queda pudiendo. La 1 hace eso sin sorpresas, igual en el alta y
en la tarjeta, y el «Va a poder» con suma y pierde es lo que evita el error real (sacarle algo sin
darse cuenta). De la 2 tomaría «Igual que alguien» (idea 11) al autorizar, que ahorra pensar, y el
aviso de cuando lo que se quiere no coincide con ningún rol (idea 12). La deducción automática de la 2
es elegante, pero esconde qué rol recibe la persona, y la auditoría y la lista hablan en roles. La 3
es la más memorable y la que mejor cuenta el «suma de llaves», pero arrastrar con un cliente
esperando es más lento que tildar.

## Movimiento, por interacción

- Tildar un rol: la casilla se pinta y el tilde aparece con rebote (200 ms); se siente un clic firme.
- «Va a poder»: cada permiso que cambia entra desde 8 px con fundido y queda en verde o en rojo; se
  ve la consecuencia antes de guardar.
- Algo que no se puede (la última, sacarse Administrar roles): la fila o la llave tiembla de lado y
  aparece el aviso; vibra doble. Se siente como una puerta trabada, no como un error.
- Confirmar que sos vos: el sello late mientras lee la huella o Google, se vuelve tilde verde y la
  hoja se cierra sola y sigue (R3.8).
- Guardar: tostada pino desde abajo con «Deshacer»; en la 1, el rol nuevo entra en la tarjeta con
  rebote.
- Interruptores de la 2: la bolita cruza con rebote; «Eso es» cambia sus pastillas con un pop.
- Llaves de la 3: la que se suma entra balanceándose en el aro y se frena (900 ms); la que se saca
  cae y se desvanece; la que se arrastra se inclina según hacia dónde se mueve.
- Todo con `transform` y `opacity`; con «reducir movimiento», nada se mueve.

## Autocrítica

- Primera pasada de la 1: la tarjeta se desbordaba a la derecha (la fila de filtros empujaba la
  columna) y el editor dejaba «Va a poder» fuera de la vista. Corregido: columnas que se achican,
  opciones compactas en la tarjeta y el diálogo de autorizar en dos columnas, con «Va a poder» al
  lado.
- Primera pasada de la 2: las fichas de tres columnas ocupaban toda la altura y «Igual que alguien» y
  «Guardar» quedaban abajo; además la lista perdía las pastillas de rol que pide R3.1. Corregido:
  fichas en renglón, en dos columnas, y la lista con los roles debajo del nombre. Queda flojo: en la
  computadora la frase de cada ficha se corta.
- Primera pasada de la 3: la leyenda de las llaves se pisaba con ellas y los botones de autorizar se
  salían del escenario. Corregido achicando el aro y la cadena. Queda flojo: con tres o más llaves se
  superponen un poco (es un llavero, pero se lee peor) y los metales son colores nuevos.
- En las tres, «Sesiones abiertas» y «Celulares con huella» quedan neutros: son de la pantalla
  aprobada y no cambian acá.

## Catálogo de ideas

1. **Sección «Roles» en la tarjeta**, cada rol con su descripción (E57) y los íconos de lo que da.
   Resuelve: ver de un vistazo qué es cada rol sin ir a Roles. En: 1. Patrón: la tarjeta de Stripe
   (miembros del equipo). Ahorra ir a otra pestaña. Dentro de las reglas.
2. **«Con esto puede»**: la suma de permisos de sus roles, y qué rol da cada uno. Resuelve: entender
   que tener dos roles es sumar (R7.5). En: 1. Patrón: Google Workspace, «acceso efectivo». Dentro de
   las reglas (lo agrega).
3. **Lo que suma y lo que pierde, antes de guardar**, en verde y rojo. Resuelve: no sacar algo sin
   querer. En: 1, 2 (pastilla tachada) y 3 (puertas que se abren con pop). Patrón: el diff de GitHub.
   Dentro de las reglas.
4. **La misma pieza al autorizar y en la tarjeta**, sin nada elegido de antemano (R3.3, E42).
   Resuelve: aprender una sola forma. En: 1, 2, 3. Dentro de las reglas.
5. **Lo que no se puede, frena en el lugar**: tiembla y dice por qué (última, sacarse Administrar
   roles o Administrar personas; R1.3, E43, E56). Resuelve: no enterarse al guardar. En: 1, 2, 3.
   Patrón: el temblor de la contraseña de macOS. Dentro de las reglas.
6. **Confirmar que sos vos solo al dar, y una vez cada 5 minutos**: el aviso aparece antes de guardar
   («Darle un rol pide confirmar que sos vos») y no al quitar (R3.8, E50). En: 1, 2, 3. Patrón:
   «sudo mode» de GitHub. Dentro de las reglas.
7. **Cada cambio, con «Deshacer»** en la tostada. Resuelve: un toque equivocado. En: 1, 2, 3. Patrón:
   Gmail. Ahorra el diálogo de confirmación. Dentro de las reglas (deshacer queda en la auditoría
   como otro cambio).
8. **Teclas 1 a 5** para tildar roles o permisos, Alt R para cambiar, Enter guarda, ↑ ↓ cambia de
   persona. En: 1, 2, 3 (computadora). Patrón: Linear. Ahorra el mouse.
9. **Filtro por rol con su cantidad** arriba de la lista (R3.1, E54). En: 1. Patrón: chips de
   Shopify. Dentro de las reglas.
10. **Elegir por permisos y deducir los roles**: se dice qué puede, la pantalla elige la combinación
    más chica de roles que da justo eso. Resuelve: no saber qué rol corresponde. En: 2. Patrón: los
    «presets» de permisos de Notion, al revés. Ahorra abrir Roles para comparar. **Fuera de las
    reglas**: R7.5 asigna roles, no permisos; acá la persona sigue recibiendo roles, pero no los
    elige ella.
11. **«Igual que alguien»**: un toque copia los roles de otra persona. Resuelve: el alta típica
    («como Pedro»). En: 2 (primero al autorizar). Patrón: «duplicar permisos de» de Microsoft 365.
    Ahorra de 2 a 4 toques. Dentro de las reglas (no marca nada solo: lo elige quien autoriza).
12. **«Ningún rol da justo eso»**: muestra el más cercano con lo que deja de más, o lleva a armar el
    rol. Resuelve: darle de más sin darse cuenta. En: 2. Dentro de las reglas.
13. **Fichas con interruptor y una frase de qué deja hacer**, con «Ver las personas» atado a
    administrar y cortar (R7.1). En: 2. Patrón: Ajustes de iOS.
14. **Los roles como llaves y la persona como llavero**. Resuelve: entender sumar y sacar como algo
    físico. En: 3. Patrón: los tableros de llaves del mostrador de copias. **Rompe** el molde de la
    tarjeta y el lenguaje (ilustración en vez de renglones).
15. **Arrastrar para dar y para sacar**, con el toque y las teclas como alternativa. En: 3. Patrón:
    Trello. **Rompe**: gesto principal nuevo (se suma, no reemplaza).
16. **Un metal por rol** (latón, cobre, acero, níquel, pavón), en las llaves y en un punto en las
    pastillas de la lista. Resuelve: reconocer un rol sin leer. En: 3. **Rompe la paleta**: colores
    fuera de «Mostrador» y color sin significado de alerta. Es una propuesta para Carlos.
17. **«Copias»**: el tablero cuenta cuántas personas tienen cada llave. En: 3 (en la 1, «N personas»
    al tildar). Dentro de las reglas.
18. **Autorizar sin diálogo**: el escenario se vuelve un llavero vacío con la etiqueta para escribir.
    En: 3. Patrón: el «nuevo contacto» en el lugar de Contactos de iOS. **Rompe** el diálogo de
    autorizar de la pantalla aprobada.
