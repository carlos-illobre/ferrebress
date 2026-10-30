# 02 · Personas: resumen

Quién puede entrar, autorizar y dar de baja, y las sesiones y celulares con huella de cada persona.
Reglas completas en [rules.md](rules.md).

**Estado:** etapa a (personas y sesiones), aprobada. Etapa b (roles y permisos), por escribir.

## Cada regla en una línea

- **Quién administra:** hasta la etapa b, todos son Administrador; el primer Administrador se carga
  al instalar con un comando que se niega si ya hay personas; nunca queda nadie activo que
  administre y nadie se da de baja a sí mismo (R1).
- **Dónde:** Más → Usuarios, una opción propia de Más, igual en el celular y en la computadora; sin
  conexión, gris (R2).
- **Las personas:** activas y dadas de baja, con «Vos», la pastilla «Administrador» y cuándo entró
  por última vez; autorizar es nombre y correo de cualquier cuenta de Google, sin mandar correos;
  el nombre escrito manda sobre el de Google; el correo se cambia y la persona se borra solo si
  nunca entró (R3).
- **Baja y alta:** la baja, con confirmación, cierra las sesiones y quita los celulares con huella;
  el alta deja entrar de nuevo, vinculando otra vez la huella (R4).
- **Sesiones y huellas:** en la tarjeta de cada persona, con dispositivo, cómo y cuándo entró y
  último uso; «Cerrar», «Cerrar todas» (con confirmación) y «Quitar», que también cierra la sesión
  de ese celular; «Se perdió un celular» corta las
  sesiones y la huella de un celular de un toque; los celulares propios van en Configuración (R5).
- **La auditoría:** cada cambio, con quién y a quién (R6).

## Lo que falta decidir

Etapa b: roles y permisos.
