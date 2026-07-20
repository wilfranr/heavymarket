# Módulo de Órdenes de Compra

## Separación entre Orden de Trabajo y Orden de Compra

- Una **Orden de Trabajo** por pedido aprobado, para controlar la ejecución logística interna.
- Una **Orden de Compra** por proveedor, agrupando todas las referencias adjudicadas a ese proveedor.
- La aprobación debe generarlas como pendientes de envío, no enviarlas automáticamente.

> La OC responde: "que le compramos a quien?"
> La OT responde: "que debe recibir, revisar, consolidar y entregar Logistica?"

No compiten entre si; controlan procesos diferentes.

Coincide con la decision que ya habiamos manejado anteriormente en HeavyMarket: al aprobar la cotizacion se creaban las OC y una OT para Logistica. El cliente esta confirmando explicitamente la parte de compras; la OT sigue siendo necesaria como documento interno.

## Flujo propuesto

```
Pedido
|
Costeo interno / oferta del proveedor
|
Cotizacion al cliente
|
Cliente aprueba
|
Pedido confirmado
|-- Orden de Trabajo logistica
|   Estado: Pendiente de abastecimiento
|
|-- Ordenes de Compra
    Una por proveedor
    Estado: Pendiente de envio
|
Enviar OC al proveedor
|
Confirmacion / despacho del proveedor
|
Recepcion parcial o total
|
Inspeccion de referencias
|
Pedido completo y conforme
|
Despacho al cliente
|
Confirmacion de entrega
|
Pedido entregado
```

La aprobacion de la cotizacion deberia crear la OT inmediatamente, porque Logistica necesita visualizar desde ese momento:

- Que repuestos estan pendientes.
- A que proveedores se compraron.
- Cuales tienen fecha estimada.
- Cuales llegaron parcialmente.
- Cuales fueron rechazados durante la inspeccion.
- Cuando el pedido esta completo y listo para despachar.

> Si esperas a que lleguen los repuestos para generar la OT, tendras un agujero negro entre "OC enviada" y "mercancia recibida". Y los agujeros negros quedan muy elegantes en astronomia, no tanto en logistica.

## Precision sobre el nombre "Orden de Trabajo"

En sistemas ERP maduros, la recepcion suele registrarse mediante un documento especifico vinculado a la OC, como **Recepcion de Compra** o **Recepcion de Almacen**. ERPNext separa la *Purchase Receipt* de la *Orden de Compra* y la *Delivery Note* del pedido de venta; Business Central tambien crea recepciones de almacen desde las ordenes de compra.

Ademas, en sistemas como Odoo, una *Work Order* se usa principalmente para operaciones de fabricacion.

### Opciones

1. Mantener `OrdenTrabajo`, porque ya existe en HeavyMarket, pero documentarla como orden interna de cumplimiento logistico.
2. Renombrarla en el futuro como:
   - `OrdenLogistica`
   - `OrdenCumplimiento`
   - `OrdenDespacho`
   - `ExpedienteLogistico`

No bloquearia el desarrollo por el nombre, pero si dejaria clara su responsabilidad. Una OT no deberia representar la recepcion en si; deberia agrupar varias recepciones y despachos.

## Documentos que deberian existir

### Pedido

Representa la solicitud y compromiso con el cliente.

**Estados:**
- Nuevo
- En costeo
- Cotizado
- Aprobado
- En abastecimiento
- Listo para despacho
- Despachado
- Entregado
- Cancelado

Evitaria `Enviado`, porque no deja claro que se envio:
- La OC al proveedor?
- Los repuestos al cliente?
- La cotizacion?
- Un PDF que salio volando por correo?

### Cotizacion del cliente

**Estados:**
- Borrador
- Emitida
- Aceptada
- Rechazada
- Vencida
- Anulada

Al aceptarse debe quedar congelada. Los precios, cantidades, TRM, utilidad y proveedor elegido deben guardarse como una fotografia historica, aunque luego cambien los maestros.

### Orden de Compra

**Estados:**
- Pendiente de envio
- Enviada
- Confirmada por proveedor
- Recibida parcialmente
- Recibida
- Cerrada
- Cancelada

No se recomienda crear una OC por cada referencia. Lo habitual seria agrupar por:

```
pedido + proveedor + moneda + direccion de recepcion
```

Asi, si tres referencias vienen del mismo proveedor, salen en una sola OC.

### Orden de Trabajo logistica

**Estados:**
- Pendiente de abastecimiento
- Recepcion parcial
- En inspeccion
- Con novedades
- Lista para despacho
- Despachada
- Entregada
- Cerrada
- Cancelada

Debe existir una sola OT por pedido, salvo que el negocio permita dividir deliberadamente un pedido en entregas independientes.

### Recepcion de compra

Debe ser una entidad separada:

- `recepciones_compra`
- `recepciones_compra_detalles`

Una OC puede tener varias recepciones:

1. El proveedor envia 5 de 10 unidades.
2. Despues envia las 5 restantes.
3. Dos llegan danadas.
4. Se genera reposicion.

Guardar solamente `cantidad_recibida` en la OT terminara quedandose corto para la trazabilidad.

### Despacho

Tambien separado de la OT:

- `despachos`
- `despacho_detalles`

Una OT puede tener uno o varios despachos, especialmente si se permiten entregas parciales al cliente.

## La aprobacion como operacion transaccional

```php
final class AprobarCotizacion
{
    public function execute(Cotizacion $cotizacion): Pedido
    {
        return DB::transaction(function () use ($cotizacion) {
            $cotizacion = Cotizacion::query()
                ->lockForUpdate()
                ->findOrFail($cotizacion->id);

            $this->validarCotizacion($cotizacion);
            $this->marcarComoAprobada($cotizacion);

            $pedido = $this->confirmarPedido($cotizacion);

            $ordenTrabajo = $this->crearOrdenTrabajo($pedido);

            $ordenesCompra = $this->crearOrdenesCompraPorProveedor(
                $pedido,
                $cotizacion
            );

            event(new CotizacionAprobada(
                $cotizacion,
                $pedido,
                $ordenTrabajo,
                $ordenesCompra,
            ));

            return $pedido;
        });
    }
}
```

### Idempotencia

- Una cotizacion no se puede aprobar dos veces.
- Una OT no se puede duplicar por doble clic.
- Una OC del mismo proveedor no debe generarse nuevamente por recargar la pagina.

### Restricciones en MySQL

- `orden_trabajos.pedido_id` UNIQUE
- `ordenes_compra`: `pedido_id` + `proveedor_id` + `revision`

La generacion de registros debe estar dentro de una transaccion. El envio de correos, PDFs y notificaciones debe ejecutarse **despues del commit**, porque Laravel advierte que los listeners en cola pueden ejecutarse antes de que una transaccion haya confirmado sus cambios.

## Cambios en Filament

En el `PedidosResource.php` actual, el mismo campo `estado` controla ventas, compras y logistica. Ademas, Logistica consulta unicamente pedidos con estado `Aprobado`, pero puede cambiarlos a `Enviado`; despues de hacerlo, esos pedidos ya no cumplirian su propio filtro y podrian desaparecer del panel.

Tambien se eliminaria el `ToggleButtons` que permite cambiar estados directamente. Los estados deberian cambiar mediante **acciones especificas**:

- Enviar a costeo
- Generar cotizacion
- Aprobar cotizacion
- Enviar OC al proveedor
- Registrar recepcion
- Aprobar inspeccion
- Preparar despacho
- Registrar despacho
- Confirmar entrega
- Cancelar

Cada accion valida sus condiciones. Por ejemplo, **Aprobar cotizacion** deberia verificar:

- Que la cotizacion este emitida.
- Que no haya sido aprobada antes.
- Que cada referencia tenga proveedor o fuente definida.
- Que precios, cantidades y moneda esten completos.
- Que exista direccion de entrega.
- Que se cumplan las reglas de pago o credito del cliente.

Filament permite colocar estas acciones en paginas y tablas, y permite envolver acciones en transacciones; en Filament 3 las operaciones no quedan transaccionadas automaticamente si no se configura expresamente.

### Estructura recomendada

La logica no deberia vivir dentro de closures gigantes del Resource:

```
app/
  Actions/
    Cotizaciones/
      AprobarCotizacion.php
    Compras/
      GenerarOrdenesCompra.php
      EnviarOrdenCompra.php
    Logistica/
      CrearOrdenTrabajo.php
      RegistrarRecepcion.php
      RegistrarDespacho.php
  Models/
  Events/
  Listeners/
  Filament/
```

## Decision final

El flujo esta bien planteado con este ajuste: **la aprobacion de la cotizacion debe crear una OT logistica y una o varias OC en borrador.**

Despues:

1. Compras o el usuario autorizado envia las OC.
2. Logistica trabaja sobre la OT.
3. Las llegadas se registran como recepciones.
4. Las inspecciones se registran por linea.
5. Los envios al cliente se registran como despachos.
6. El pedido solo pasa a `Entregado` cuando existe confirmacion real de recepcion por parte del cliente.

Esto evita que `Pedido` termine siendo cotizacion, OC, recepcion, inspeccion, despacho y prueba de entrega al mismo tiempo. Un solo modelo haciendo seis trabajos suele acabar solicitando vacaciones.

## Recepción de compra desde Orden de Trabajo

La recepción física de repuestos no se registra editando cantidades dentro de la OC. Logística inicia la acción **Registrar recepción** desde la Orden de Trabajo del pedido, selecciona la OC relacionada y registra líneas con cantidad recibida, cantidad conforme, cantidad rechazada y motivo de rechazo cuando aplique.

La OC conserva su responsabilidad documental: expresar lo solicitado al proveedor. Sus estados de recepción se actualizan automáticamente a partir de las recepciones activas:

- Si hay recepción física parcial o cantidad conforme menor a la ordenada: `Recibida parcialmente`.
- Si la cantidad conforme acumulada cubre la cantidad ordenada: `Recibida`.
- La mercancía rechazada no completa el saldo; queda como novedad hasta reposición, ajuste o cancelación formal.

Las recepciones son eventos auditables en `recepciones_compra` y `recepcion_compra_detalles`; no se editan directamente.
