# Personas

- Computadora: En Más → Usuarios ves quién puede entrar a Ferrebress, autorizás a alguien nuevo, armás los roles y cortás sus sesiones o su huella si hace falta. Hace falta internet.
- Celular: En Más → Usuarios ves quién puede entrar, autorizás a alguien nuevo, armás los roles y, si se pierde un celular, lo cortás en un toque. Hace falta internet.

## ¿Cómo se autoriza a un usuario?

- Id: authorize
- Dispositivo: computadora
- Ícono: user-round
- Aclaración: Para que una persona nueva pueda entrar.

1. En el menú de la izquierda, tocá Más y elegí Usuarios. También se abre con Alt S.
   Captura: desktop-more-users · users · Usuarios
2. Tocá «Autorizar a alguien», arriba a la derecha.
   Captura: desktop-users · authorize · Autorizar a alguien
3. Escribí su correo de Google y, si querés, su nombre: si queda vacío, se ve el de Google cuando entre. Tildá al menos uno de sus roles.
   Captura: desktop-users-authorize · email · Su correo de Google
4. Tocá «Autorizar». Avisale vos que ya puede entrar: Ferrebress no le manda ningún correo.
   Captura: desktop-users-authorize · yes · Autorizar

> Sirve cualquier cuenta de Google, también la de una empresa.

> Si hace más de 5 minutos que entraste, te pide «Continuar con Google» o la huella antes de autorizar, y después sigue solo. Así nadie usa una computadora que quedó abierta para darse acceso.

## ¿Cómo se busca a un usuario?

- Id: search
- Dispositivo: computadora
- Ícono: search

1. Escribí parte de su nombre o de su correo en el buscador. También se abre con la tecla «/».
   Captura: desktop-users · search · Buscador
2. Al lado están los filtros: todas, activas, las que todavía no entraron y las dadas de baja.
   Captura: desktop-users · filters · Filtros
3. Tocá a la persona. Su tarjeta aparece a la derecha.
   Captura: desktop-users · person · La persona

## ¿Cómo se cambia el nombre o el correo?

- Id: edit
- Dispositivo: computadora
- Ícono: pencil

1. En su tarjeta, tocá el lápiz al lado del nombre, escribí el nuevo y tocá Enter.
   Captura: desktop-users · name · Cambiar el nombre
2. El correo se cambia solo si la persona todavía no entró. Tocá el lápiz al lado del correo.
   Captura: desktop-users-never · email · Cambiar el correo
3. Si se autorizó a alguien por error y nunca entró, tocá «Borrar el alta».
   Captura: desktop-users-never · delete · Borrar el alta

> Si borrás el nombre, se ve el de Google.

> Cuando la persona ya entró, su cuenta de Google queda atada a ella. Para que use otra cuenta, autorizá el correo nuevo y dale de baja a la vieja.

## ¿Cómo se cortan las sesiones y la huella de un usuario?

- Id: sessions
- Dispositivo: computadora
- Ícono: monitor
- Aclaración: Para sacar a alguien de un dispositivo sin darle de baja.

1. En su tarjeta están sus sesiones abiertas: en qué dispositivo, cómo entró y cuándo la usó por última vez.
   Captura: desktop-users · sessions · Sesiones abiertas
2. «Cerrar» cierra una sesión. Ese dispositivo vuelve a la entrada.
   Captura: desktop-users · close · Cerrar
3. «Cerrar todas» las cierra de una vez, y te pregunta antes. Es lo que se hace si no sabés cuál es.
   Captura: desktop-users · close-all · Cerrar todas
4. Abajo están sus celulares con huella. «Quitar» le saca la huella a ese celular y cierra su sesión.
   Captura: desktop-users · remove · Quitar

> Tus propios celulares van en Configuración.

## ¿Qué se hace si se perdió un celular?

- Id: lost
- Dispositivo: computadora
- Ícono: smartphone
- Marca: Lo más urgente / Lo urgente
- Aclaración: Si alguien perdió el celular o se lo robaron.

1. Tocá «Se perdió un celular», arriba.
   Captura: desktop-users · lost · Se perdió un celular
2. Elegí de quién es y cuál de sus celulares. Si tiene uno solo, ya está elegido.
   Captura: desktop-users-lost · phone · El celular
3. Tocá «Cortar». Se cierra su sesión, la de las computadoras que ese celular hizo entrar con el código y se le quita la huella. No pregunta.
   Captura: desktop-users-lost · cut · Cortar

> Si el celular aparece, se vincula de nuevo.

## ¿Cómo se da de baja o de alta a un usuario?

- Id: deactivate
- Dispositivo: computadora
- Ícono: ban
- Aclaración: Para alguien que deja de trabajar en la ferretería.

1. En su tarjeta, abajo, tocá «Dar de baja».
   Captura: desktop-users · deactivate · Dar de baja
2. Te dice qué va a pasar: se cierran todas sus sesiones, se le quitan las huellas y ya no entra. Tocá «Dar de baja» para confirmar.
   Captura: desktop-users-deactivate · yes · Confirmar
3. Sigue en la lista, al final, como dada de baja. Para que vuelva, tocá su nombre y «Dar de alta».
   Captura: desktop-users-off · activate · Dar de alta

> Nadie se puede dar de baja a sí mismo, y siempre tiene que quedar un Administrador.

> Al darle de alta, entra con su misma cuenta de Google. Sus celulares con huella los vincula de nuevo.

## ¿Cómo se busca un rol?

- Id: roles-search
- Dispositivo: computadora
- Ícono: search

1. En Usuarios, tocá la pestaña «Roles».
   Captura: desktop-roles · tab · Roles
2. Escribí parte del nombre del rol, de un permiso o de una persona que lo tiene. La lista cambia mientras escribís. También se abre con la tecla «/».
   Captura: desktop-roles · search · Buscador
3. Tocá el rol para verlo: sus permisos y quiénes lo tienen.
   Captura: desktop-roles · role · El rol

## ¿Cómo se crea un rol?

- Id: roles-new
- Dispositivo: computadora
- Ícono: list-checks

1. En la pestaña «Roles», tocá «Nuevo rol». También con Alt O.
   Captura: desktop-roles · new · Nuevo rol
2. Escribí su nombre y, si querés, para quién es.
   Captura: desktop-role-new · name · Nombre del rol
3. Tildá los permisos que va a dar. Cada parte de Ferrebress se abre y se cierra tocándola.
   Captura: desktop-role-permissions · permission · Un permiso
4. Tocá «Crear el rol». Hasta entonces no se guarda nada.
   Captura: desktop-role-new · create · Crear el rol

> Si salís sin guardar, te pregunta si querés descartar lo que cambiaste.

> «Duplicar» arma un rol nuevo con los mismos permisos, para cambiarle lo que haga falta.

## ¿Cómo se da un rol a alguien?

- Id: roles-give
- Dispositivo: computadora
- Ícono: users

1. Abrí el rol y, en «Quiénes lo tienen», tocá «Darle este rol a…».
   Captura: desktop-role-give · person · La persona
2. Elegí a la persona. Queda marcada hasta que guardes; «Deshacer» lo vuelve atrás. Para sacárselo a alguien, tocá «Sacárselo».
   Captura: desktop-role-given · take · Sacárselo
3. Tocá «Guardar rol»: se guarda todo junto, el nombre, los permisos y las personas.
   Captura: desktop-role-given · save · Guardar rol

> Si hace más de 5 minutos que entraste, te pide «Continuar con Google» o la huella antes de dar acceso, y te dice qué estás dando.

> Cada persona tiene que quedar con al menos un rol. El Administrador no se borra.

## ¿Cómo se autoriza a un usuario?

- Id: authorize
- Dispositivo: celular
- Ícono: user-round

1. Tocá Más, abajo a la derecha, y elegí Usuarios.
   Captura: phone-more-users · users · Usuarios
2. Tocá «Autorizar a alguien», abajo.
   Captura: phone-users · authorize · Autorizar a alguien
3. Escribí su correo de Google y, si querés, su nombre. Tocá «Autorizar». Después avisale que ya puede entrar: Ferrebress no le manda ningún correo.
   Captura: phone-users-authorize · yes · Autorizar

> Si hace más de 5 minutos que entraste, te pide la huella o Google antes de autorizar.

## ¿Cómo se busca a un usuario?

- Id: search
- Dispositivo: celular
- Ícono: search

1. Tocá «Buscar usuario», arriba.
   Captura: phone-users · search · Buscar usuario
2. Escribí parte de su nombre o de su correo. La lista cambia mientras escribís.
   Captura: phone-users-search · box · Buscar
3. Abajo podés elegir qué personas ver. Tocá el botón naranja para volver a la lista.
   Captura: phone-users-search · chips · Filtros

> Un punto naranja en «Buscar usuario» avisa que quedó una búsqueda o un filtro puesto. «Limpiar» lo saca.

## ¿Cómo se cortan las sesiones y la huella de un usuario?

- Id: sessions
- Dispositivo: celular
- Ícono: monitor

1. Tocá a la persona. Se abre su tarjeta.
   Captura: phone-users · person · La persona
2. «Cortar sesión» cierra todas sus sesiones, y te pregunta antes.
   Captura: phone-users-card · cut · Cortar sesión
3. «Quitar huella» le saca la huella a su celular y cierra su sesión ahí.
   Captura: phone-users-card · passkey · Quitar huella
4. Para cerrar una sola sesión, tocá «Cerrar» al lado de esa.
   Captura: phone-users-card · close · Cerrar

## ¿Qué se hace si se perdió un celular?

- Id: lost
- Dispositivo: celular
- Ícono: smartphone
- Marca: Lo más urgente / Lo urgente

1. En Usuarios, tocá «Se perdió un celular», abajo.
   Captura: phone-users · lost · Se perdió un celular
2. Elegí de quién es y cuál de sus celulares. Si tiene uno solo, ya está elegido.
   Captura: phone-users-lost · phone · El celular
3. Tocá «Cortar». Se cierra su sesión y se le quita la huella, sin preguntar.
   Captura: phone-users-lost · cut · Cortar

## ¿Cómo se da de baja o de alta a un usuario?

- Id: deactivate
- Dispositivo: celular
- Ícono: ban

1. En su tarjeta, bajá hasta el final y tocá «Dar de baja».
   Captura: phone-users-foot · deactivate · Dar de baja
2. Te dice qué va a pasar. Tocá «Dar de baja» para confirmar.
   Captura: phone-users-deactivate · yes · Confirmar
3. Para que vuelva, tocá su nombre en «Dadas de baja» y «Dar de alta».
   Captura: phone-users-off · activate · Dar de alta

## ¿Cómo se busca un rol?

- Id: roles-search
- Dispositivo: celular
- Ícono: search

1. En Usuarios, tocá «Roles», arriba.
   Captura: phone-roles · tab · Roles
2. Escribí parte del nombre del rol, de un permiso o de una persona que lo tiene.
   Captura: phone-roles · search · Buscador
3. Tocá el rol para verlo.
   Captura: phone-roles · role · El rol

## ¿Cómo se crea un rol?

- Id: roles-new
- Dispositivo: celular
- Ícono: list-checks

1. En «Roles», tocá «Nuevo rol».
   Captura: phone-roles · new · Nuevo rol
2. Escribí su nombre y, si querés, para quién es.
   Captura: phone-role-new · name · Nombre del rol
3. Tildá los permisos que va a dar.
   Captura: phone-role-new · permission · Un permiso
4. Tocá «Crear», arriba. Hasta entonces no se guarda nada.
   Captura: phone-role-new · create · Crear

> Para volver sin guardar, usá el atrás del celular: te pregunta si querés descartar lo que cambiaste.

## ¿Cómo se da un rol a alguien?

- Id: roles-give
- Dispositivo: celular
- Ícono: users

1. Abrí el rol, bajá hasta «Quiénes lo tienen» y tocá «Darle este rol a…». Elegí a la persona.
   Captura: phone-role-give · person · La persona
2. Queda marcada hasta que guardes. Para sacárselo a alguien, tocá «Sacárselo».
   Captura: phone-role-given · take · Sacárselo
3. Tocá «Guardar», arriba.
   Captura: phone-role-given · save · Guardar

> Si hace más de 5 minutos que entraste, te pide la huella o Google antes de dar acceso.
