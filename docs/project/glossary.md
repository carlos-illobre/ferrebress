# Glosario

Las palabras del negocio, qué quieren decir y cómo se nombran en el código. Cada palabra tiene
una sola traducción: la de esta tabla. Una palabra nueva se agrega acá antes de usarla en el
código (constitución, principio IX).

En el código se escriben en `camelCase` (variables, funciones), `PascalCase` (tipos) o
`snake_case` (tablas y columnas); en las rutas de la API, en plural y con guiones
(`price-lists`).

## Catálogo

| Castellano | Qué es | En el código |
|---|---|---|
| Producto | Lo que se vende, con su descripción, marca, código de barras y unidad | `product` |
| Proveedor | Quien le vende a la ferretería | `supplier` |
| Lista (de precios) | El archivo que manda un proveedor con sus productos y precios | `priceList` |
| Lector de lista | Lo que entiende el formato de la lista de un proveedor | `priceListReader` |
| Código del proveedor | Cómo identifica un proveedor a un producto | `supplierCode` |
| Precio de lista | Lo que figura en la lista del proveedor, antes de descuentos | `listPrice` |
| Descuento | Lo que el proveedor resta al precio de lista | `discount` |
| Costo | Lo que le cuesta el producto a la ferretería, con descuentos e IVA | `cost` |
| Margen | El porcentaje que se suma al costo | `margin` |
| Precio de venta | Costo más margen, redondeado | `salePrice` |
| Proveedor en uso | El proveedor del que sale el costo de un producto | `preferredSupplier` |
| Duplicados | Dos productos que son el mismo, vendidos por distintos proveedores | `duplicates` |
| Equivalencia | Que un producto es el mismo que otro; se anota al unir duplicados | `productEquivalence` |
| Unir / separar | Juntar dos duplicados en uno, o deshacerlo | `merge` / `unmerge` |
| Código de barras | El código impreso en el producto | `barcode` |
| Unidad | Cómo se vende: por unidad, kilo, metro, litro | `unit` |
| Fraccionado | Lo que se vende con decimales (por kilo, metro, litro) | `fractional` |
| Ficha del producto | Todo lo de un producto en una pantalla | `productDetail` |
| Foto del producto | La foto que se le saca al producto | `productPhoto` |
| Remarcar | Cambiar el precio de lo que está en la estantería | `reprice` |

## Ventas

| Castellano | Qué es | En el código |
|---|---|---|
| Venta | Lo que se cobra en el mostrador | `sale` |
| Renglón | Un producto dentro de una venta, una compra o un pedido, con su cantidad | `line` |
| Cobrar | Registrar la venta con su medio de pago | `charge` |
| Medio de pago | Efectivo, Mercado Pago, tarjeta o cuenta corriente | `paymentMethod` |
| Efectivo | | `cash` |
| Mercado Pago | | `mercadoPago` |
| Tarjeta | | `card` |
| Cuenta corriente | La deuda de un cliente que paga después | `creditAccount` |
| Precio a mano | Un precio puesto para una venta, que no cambia el del producto | `manualPrice` |
| Anular | Dejar sin efecto una venta o una compra; queda registrada como anulada | `void` |
| Corregir | Cambiar una venta ya registrada, guardando lo anterior | `correct` / `correction` |
| Cambio | Devolver un producto y llevarse otro | `exchange` |
| Consulta no satisfecha / no llevó | Lo que un cliente pidió y no se vendió (no estaba en ninguna lista, no había, el precio), con el motivo | `lostSale` |
| Ventas de hoy | Las ventas del día del local | `todaySales` |
| Día del local | El día calendario en la hora del local | `businessDay` |

## Clientes

| Castellano | Qué es | En el código |
|---|---|---|
| Cliente | Quien compra; los importantes tienen cuenta corriente | `customer` |
| Pago | Lo que un cliente paga de su cuenta corriente | `payment` |
| Saldo | Lo que un cliente debe | `balance` |

## Compras y stock

| Castellano | Qué es | En el código |
|---|---|---|
| Compra / ingreso de mercadería | Lo que llega de un proveedor y suma stock | `purchase` |
| Comprobante | La factura o el remito de una compra | `voucher` |
| Factura | | `invoice` |
| Remito | | `deliveryNote` |
| Pedido (a proveedor) | Lo que se le encarga a un proveedor | `purchaseOrder` |
| Enviar / cancelar / cerrar un pedido | | `send` / `cancel` / `close` |
| Stock | Cuánto hay de cada producto | `stock` |
| Movimiento de stock | Cada suma o resta del stock, con su motivo | `stockMovement` |
| Ajuste de stock | Una corrección a mano, con su motivo | `stockAdjustment` |
| Conteo | Contar lo que hay en un sector | `stockCount` |
| Sector | Una parte del local o del depósito que se cuenta junta | `area` |
| Anomalía | Una diferencia entre el sistema y la realidad | `anomaly` |
| No inventariado | Lo que se vendió sin stock registrado: el stock queda en cero y se anota como anomalía | `uninventoried` |

## Números del negocio

| Castellano | Qué es | En el código |
|---|---|---|
| Cómo va el negocio | Los números: ventas, compras e inventario | `businessOverview` |
| Dinero invertido | Lo que vale el stock al costo | `inventoryValue` |
| Gastos | Lo que se gasta en compras y gastos fijos | `expenses` |
| Cierre de caja | El efectivo contado contra las ventas en efectivo | `cashClosing` |
| Ticket promedio | Lo que se vende en promedio por venta | `averageTicket` |

## La aplicación

| Castellano | Qué es | En el código |
|---|---|---|
| Marco | El menú, la luz de conexión y la tarjeta de la persona, alrededor de cada pantalla | `frame` |
| Ambiente | Pruebas o producción | `environment` (`testing` / `production`) |
| Versión nueva | Una versión de la aplicación que ya está en el servidor | `update` |
| Algo salió mal | El aviso de un error inesperado, con la captura y los últimos pasos | `crashReport` |

## Usuarios y acceso

| Castellano | Qué es | En el código |
|---|---|---|
| Persona / usuario | Quien puede entrar | `user` |
| Autorizar | Dar de alta a alguien con su correo | `authorize` |
| Activar / dar de baja | Dejar entrar o no a alguien | `activate` / `deactivate` |
| Rol | Un grupo de permisos con un nombre | `role` |
| Permiso | Algo que se puede hacer; son fijos | `permission` |
| Sesión | Un dispositivo en el que alguien está adentro | `session` |
| Entrar / salir | Abrir o cerrar la propia sesión | `signIn` / `signOut` |
| Cerrar a distancia | Cerrar la sesión de otro dispositivo | `revoke` |
| Llave de prueba | Lo que prueba, sin conexión, de qué sesión salió algo | `proofKey` |
| Dispositivo | Un navegador en un celular o una computadora, con su identificador | `device` |
| Huella | Entrar con el lector del celular, sin contraseña | `passkey` |
| Celular con huella | Un celular vinculado para entrar con la huella | `passkey` |
| Entrar con el celular | Entrar a la computadora leyendo su código con el celular | `phoneSignIn` |
| Código de entrada | El código QR que muestra la computadora para entrar | `signInCode` |
| Leer / aprobar / «No soy yo» | Lo que hace el celular con un código de entrada | `read` / `approve` / `cancel` |
| Lo apartado | Lo que hizo sin conexión alguien a quien dieron de baja, a la espera de que un Administrador lo revise | `heldChange` |
| Aprobar / rechazar | Aplicar lo apartado o dejarlo sin efecto | `approve` / `reject` |
| Administración | Los ajustes que fija un Administrador y cumplen todos los dispositivos | `administration` |
| Configuración | Lo que elige cada persona para su dispositivo | `deviceSettings` |
| Trabajar sin conexión | El ajuste de un dispositivo para seguir atendiendo sin internet | `offline` |
| Hora no confirmada | Una hora que salió del reloj del dispositivo y puede no ser cierta | `unconfirmedTime` |

## Celular y computadora

| Castellano | Qué es | En el código |
|---|---|---|
| Vínculo / emparejamiento | Un celular y una computadora de la misma persona, que trabajan juntos | `pairing` |
| Vincular / desvincular | Crear o terminar el vínculo | `pair` / `unpair` |
| Espejo | Los dos vinculados en la misma parte y con el mismo trabajo en curso | `mirror` |
| Canal | La conexión abierta por la que llegan los avisos a un dispositivo | `channel` |
| Lector | El celular leyendo códigos de barras para la computadora | `scanner` |
| Acción | Algo que hace la persona en la aplicación, con un nombre (agregar un renglón, cobrar) | `action` |

## Quién hizo qué, mejoras y procesos

| Castellano | Qué es | En el código |
|---|---|---|
| Quién hizo qué | El registro de cada acción, con quién la hizo | `auditLog` |
| Evento | Una acción registrada | `event` |
| Ticket | Un aviso de error o un pedido de mejora | `ticket` |
| Error / mejora | Los dos tipos de ticket | `bug` / `improvement` |
| Resolver / reabrir | | `resolve` / `reopen` |
| Proceso | Un proceso del negocio dibujado con sus pasos | `process` |
| Paso | | `step` |
| Vigente / borrador | La versión que vale y la que se está cambiando | `current` / `draft` |
