# 02 · Personas: resumen

Quién puede entrar, autorizar y dar de baja, y las sesiones y celulares con huella de cada persona.
Reglas completas en [rules.md](rules.md).

**Estado:** etapa a (personas y sesiones), aprobada. Etapa b (roles y permisos), aprobada.

## Cada regla en una línea

- **Quién administra:** cada cosa la hace quien tiene su permiso; el primer Administrador se carga al
  instalar con un comando que se niega si ya hay personas; siempre queda alguien activo con
  «Administrar personas» y alguien con «Administrar roles», y nadie se los quita a sí mismo (R1).
- **Dónde:** Más → Usuarios, con las pestañas Usuarios, Roles y Auditoría, cada una para quien tiene
  su permiso; igual en el celular y en la computadora; sin conexión, gris (R2).
- **Las personas:** activas y dadas de baja, con «Vos», una pastilla por rol (y filtro por rol) y
  cuándo entró por última vez; autorizar es nombre, correo de cualquier cuenta de Google y al menos
  un rol elegido a mano, sin mandar correos; el nombre escrito manda sobre el de Google; el correo se
  cambia y la persona se borra solo si nunca entró; lo que da acceso pide Google o la huella de los
  últimos 5 minutos (R3).
- **Baja y alta:** la baja, con confirmación, cierra las sesiones y quita los celulares con huella;
  el alta deja entrar de nuevo, vinculando otra vez la huella (R4).
- **Sesiones y huellas:** en la tarjeta de cada persona, con dispositivo, cómo y cuándo entró y
  último uso; «Cerrar», «Cerrar todas» (con confirmación) y «Quitar», que también cierra la sesión
  de ese celular; «Se perdió un celular» corta las
  sesiones y la huella de un celular de un toque; los celulares propios van en Configuración (R5).
- **La auditoría:** cada cambio, con quién y a quién; los de roles, con lo que había y lo que quedó
  (R6).
- **Roles y permisos:** cuatro permisos fijos (ver, administrar personas, cortar sesiones y huellas,
  administrar roles); roles armables con nombre, que se duplican y se borran solo si nadie los
  tiene; al instalar, solo Administrador, que recibe todo permiso nuevo; cada persona activa tiene
  al menos un rol; el servidor controla cada pedido; lo que no se puede usar no aparece, y por la
  dirección dice qué permiso falta; sin conexión, los últimos permisos conocidos (R7).

## Lo que falta decidir

Nada.
