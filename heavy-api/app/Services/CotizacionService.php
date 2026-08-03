<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\OrdenCompraEstado;
use App\Enums\PedidoEstado;
use App\Models\Cotizacion;
use App\Models\CotizacionReferenciaProveedor;
use App\Models\Empresa;
use App\Models\OrdenCompra;
use App\Models\OrdenCompraReferencia;
use App\Models\OrdenTrabajo;
use App\Models\OrdenTrabajoReferencia;
use App\Models\Pedido;
use App\Models\PedidoReferencia;
use App\Models\PedidoReferenciaProveedor;
use App\Models\TRM;
use App\Models\User;
use App\Notifications\SystemNotification;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\DB;

/**
 * Servicio de lógica de negocio para Cotizaciones
 *
 * Maneja los cálculos complejos de cotizaciones, conversiones
 * de moneda y generación de documentos.
 */
class CotizacionService
{
    /**
     * Crear cotización desde un pedido
     *
     * @param  array<string, mixed>  $datosAdicionales
     */
    public function crearDesdePedido(Pedido $pedido, array $datosAdicionales = []): Cotizacion
    {
        return DB::transaction(function () use ($pedido, $datosAdicionales) {
            $cotizacion = Cotizacion::create([
                'pedido_id' => $pedido->id,
                'tercero_id' => $pedido->tercero_id,
                'user_id' => $datosAdicionales['user_id'] ?? auth()->id(),
                'estado' => 'En_Proceso',
                'fecha_emision' => now(),
                'fecha_vencimiento' => now()->addDays(30),
            ]);

            // Copiar referencias del pedido a la cotización
            foreach ($pedido->referencias as $pedidoReferencia) {
                CotizacionReferenciaProveedor::create([
                    'cotizacion_id' => $cotizacion->id,
                    'referencia_id' => $pedidoReferencia->referencia_id,
                    'cantidad' => $pedidoReferencia->cantidad,
                    'precio_unitario' => 0, // Se completará después
                ]);
            }

            return $cotizacion->load('referenciasProveedores');
        });
    }

    /**
     * Calcular precio total de una cotización
     *
     * @param  string  $moneda  'COP' o 'USD'
     */
    public function calcularPrecioTotal(Cotizacion $cotizacion, string $moneda = 'COP'): float
    {
        $total = $cotizacion->referenciasProveedores->sum(function ($item) {
            $prp = $item->pedidoReferenciaProveedor;

            return $prp ? $prp->cantidad * $prp->precio_unitario : 0;
        });

        // Si se requiere en USD, convertir
        if ($moneda === 'USD' && $total > 0) {
            $trm = $this->obtenerTRM();
            $total = $total / $trm;
        }

        return round($total, 2);
    }

    /**
     * Aplicar margen de ganancia
     */
    public function aplicarMargen(float $precioBase, float $porcentajeMargen): float
    {
        return round($precioBase * (1 + $porcentajeMargen / 100), 2);
    }

    /**
     * Calcular precio con impuestos
     *
     * @return array{subtotal: float, iva: float, total: float}
     */
    public function calcularConImpuestos(float $precioBase, float $porcentajeIVA = 19): array
    {
        $subtotal = $precioBase;
        $iva = round($subtotal * ($porcentajeIVA / 100), 2);
        $total = $subtotal + $iva;

        return [
            'subtotal' => $subtotal,
            'iva' => $iva,
            'total' => $total,
        ];
    }

    /**
     * Obtener la TRM actual
     */
    private function obtenerTRM(): float
    {
        $trm = TRM::orderBy('fecha', 'desc')->first();

        return $trm?->trm ?? 4000.0; // Valor por defecto si no hay TRM
    }

    /**
     * Aprobar cotizacion desde el flujo de respuesta del pedido.
     *
     * Transaccion atomica que:
     * 1. Transita pedido a Aprobado
     * 2. Marca cotizacion activa como Aprobada
     * 3. Crea Orden de Trabajo
     * 4. Crea Orden de Compra
     */
    public function aprobarDesdePedido(Pedido $pedido, string $comentario = ''): void
    {
        $cotizacionActiva = $this->cotizacionActivaParaPedido($pedido);

        if (! $cotizacionActiva) {
            throw new \InvalidArgumentException('No hay una cotización activa para aprobar.');
        }

        $this->aprobar($cotizacionActiva, $comentario);
    }

    /**
     * Rechazar cotizacion desde el flujo de respuesta del pedido.
     *
     * Transaccion atomica que:
     * 1. Transita pedido a Rechazado
     * 2. Marca cotizacion activa como Rechazada
     */
    public function rechazarDesdePedido(Pedido $pedido, string $comentario = ''): void
    {
        $cotizacionActiva = $this->cotizacionActivaParaPedido($pedido);

        if (! $cotizacionActiva) {
            throw new \InvalidArgumentException('No hay una cotización activa para rechazar.');
        }

        $this->rechazar($cotizacionActiva, $comentario);
    }

    /**
     * Aprobar cotizacion.
     *
     * Al aprobar se crean automaticamente:
     * - Orden de Trabajo
     * - Orden de Compra (con referencias de proveedores)
     *
     * @param  array<int>|null  $referenciaIds
     */
    public function aprobar(Cotizacion $cotizacion, string $comentario = '', ?array $referenciaIds = null): Cotizacion
    {
        return DB::transaction(function () use ($cotizacion, $comentario, $referenciaIds) {
            $cotizacion->loadMissing(['pedido', 'referenciasProveedores.pedidoReferenciaProveedor']);
            $pedido = $cotizacion->pedido;

            if (! in_array($cotizacion->estado, ['Enviada', 'Borrador'], true)) {
                throw new \InvalidArgumentException('Solo se pueden aprobar cotizaciones activas.');
            }

            $itemsCotizados = $cotizacion->referenciasProveedores;
            $referenciaIdsAprobadas = $referenciaIds === null
                ? $itemsCotizados->pluck('id')->map(fn ($id) => (int) $id)->all()
                : array_values(array_unique(array_map('intval', $referenciaIds)));

            if ($referenciaIdsAprobadas === []) {
                throw new \InvalidArgumentException('Debe aprobar al menos una referencia.');
            }

            $idsCotizacion = $itemsCotizados->pluck('id')->map(fn ($id) => (int) $id)->all();
            if (array_diff($referenciaIdsAprobadas, $idsCotizacion) !== []) {
                throw new \InvalidArgumentException('Una de las referencias seleccionadas no pertenece a la cotización.');
            }

            if ($pedido) {
                $pedido->transitarA(PedidoEstado::Aprobado);
                $pedido->save();
            }

            Cotizacion::query()
                ->where('pedido_id', $cotizacion->pedido_id)
                ->where('id', '!=', $cotizacion->id)
                ->whereIn('estado', ['Enviada', 'Borrador'])
                ->update(['estado' => 'Rechazada']);

            $observaciones = $cotizacion->observaciones ?? '';
            if ($comentario !== '') {
                $observaciones = trim($observaciones.'
Aprobada: '.$comentario);
            }

            $cotizacion->referenciasProveedores()->update([
                'estado_aprobacion' => 'Rechazada',
                'fecha_aprobacion' => null,
            ]);

            $cotizacion->referenciasProveedores()
                ->whereIn('id', $referenciaIdsAprobadas)
                ->update([
                    'estado_aprobacion' => 'Aprobada',
                    'fecha_aprobacion' => now(),
                ]);

            $cotizacion->refresh()->load(['pedido', 'tercero', 'user', 'referenciasProveedores.pedidoReferenciaProveedor']);

            $cotizacion->update([
                'estado' => 'Aprobada',
                'observaciones' => $observaciones ?: $cotizacion->observaciones,
                'total' => $this->calcularTotalItemsAprobados($cotizacion),
            ]);

            $cotizacion->refresh()->load(['pedido', 'tercero', 'user', 'referenciasProveedores.pedidoReferenciaProveedor']);

            $this->crearOrdenTrabajo($cotizacion);
            $this->crearOrdenCompra($cotizacion);

            return $cotizacion->fresh(['pedido', 'tercero', 'user', 'referenciasProveedores']);
        });
    }

    /**
     * Crear Orden de Trabajo a partir de cotización aprobada
     */
    private function crearOrdenTrabajo(Cotizacion $cotizacion): void
    {
        $pedido = $cotizacion->pedido;

        $ordenTrabajo = OrdenTrabajo::create([
            'user_id' => auth()->id(),
            'tercero_id' => $cotizacion->tercero_id,
            'pedido_id' => $pedido?->id,
            'cotizacion_id' => $cotizacion->id,
            'estado' => 'Pendiente',
            'fecha_ingreso' => now(),
            'fecha_entrega' => null,
            'telefono' => null,
            'observaciones' => "Generada automáticamente desde cotización #{$cotizacion->id}",
            'guia' => null,
            'transportadora_id' => null,
            'archivo' => null,
            'motivo_cancelacion' => null,
        ]);

        // Copiar referencias de la cotizacion a la orden de trabajo
        foreach ($cotizacion->referenciasProveedores as $item) {
            if ($item->estado_aprobacion !== 'Aprobada') {
                continue;
            }

            $prp = $item->pedidoReferenciaProveedor;
            if (! $prp) {
                continue;
            }

            // Buscar o crear el PedidoReferencia asociado
            $pedidoReferencia = PedidoReferencia::where('pedido_id', $pedido?->id)
                ->where('referencia_id', $prp->referencia_id)
                ->first();

            if ($pedidoReferencia) {
                OrdenTrabajoReferencia::create([
                    'orden_trabajo_id' => $ordenTrabajo->id,
                    'pedido_referencia_id' => $pedidoReferencia->id,
                    'cantidad' => $prp->cantidad,
                    'cantidad_recibida' => 0,
                    'estado' => 'Pendiente',
                    'recibido' => false,
                ]);
            }
        }
    }

    /**
     * Crear Orden de Compra a partir de cotización aprobada
     */
    private function crearOrdenCompra(Cotizacion $cotizacion): void
    {
        $pedido = $cotizacion->pedido;

        // Agrupar referencias por proveedor
        $proveedores = [];
        foreach ($cotizacion->referenciasProveedores as $item) {
            if ($item->estado_aprobacion !== 'Aprobada') {
                continue;
            }

            $prp = $item->pedidoReferenciaProveedor;
            if (! $prp) {
                continue;
            }

            $proveedorId = $prp->proveedor_id ?? null;
            if (! $proveedorId) {
                continue;
            }

            if (! isset($proveedores[$proveedorId])) {
                $proveedores[$proveedorId] = [];
            }

            $proveedores[$proveedorId][] = [
                'referencia_id' => $prp->referencia_id,
                'cantidad' => $prp->cantidad,
                'valor_unitario' => $prp->valor_unidad,
                'valor_total' => $prp->valor_total ?? ($prp->cantidad * $prp->valor_unidad),
            ];
        }

        // Crear una orden de compra por cada proveedor
        foreach ($proveedores as $proveedorId => $referencias) {
            $ordenCompra = OrdenCompra::create([
                'tercero_id' => $cotizacion->tercero_id,
                'pedido_id' => $pedido?->id,
                'cotizacion_id' => $cotizacion->id,
                'proveedor_id' => $proveedorId,
                'estado' => OrdenCompraEstado::PendienteDeEnvio->value,
                'fecha_expedicion' => now(),
                'fecha_entrega' => null,
                'observaciones' => "Generada automáticamente desde cotización #{$cotizacion->id}",
                'direccion' => null,
                'telefono' => null,
                'guia' => null,
                'color' => OrdenCompraEstado::PendienteDeEnvio->color(),
            ]);

            foreach ($referencias as $ref) {
                OrdenCompraReferencia::create([
                    'orden_compra_id' => $ordenCompra->id,
                    'referencia_id' => $ref['referencia_id'],
                    'cantidad' => $ref['cantidad'],
                    'valor_unitario' => $ref['valor_unitario'],
                    'valor_total' => $ref['valor_total'],
                ]);
            }

            // Recalcular total
            $valorTotal = $ordenCompra->getTotalReferencias();
            $ordenCompra->update(['valor_total' => $valorTotal]);
        }
    }

    /**
     * Totalizar solo las lineas aprobadas por el cliente.
     */
    private function calcularTotalItemsAprobados(Cotizacion $cotizacion): float
    {
        $total = $cotizacion->referenciasProveedores
            ->filter(fn ($item) => $item->estado_aprobacion === 'Aprobada')
            ->sum(function ($item): float {
                if ($item->snapshot_valor_total !== null) {
                    return (float) $item->snapshot_valor_total;
                }

                $prp = $item->pedidoReferenciaProveedor;
                if (! $prp) {
                    return 0.0;
                }

                if ($prp->valor_total !== null) {
                    return (float) $prp->valor_total;
                }

                $cantidad = (float) ($prp->cantidad ?? 0);
                $valorUnidad = (float) ($prp->valor_unidad ?? 0);

                return $cantidad * $valorUnidad;
            });

        return round((float) $total, 2);
    }

    /**
     * Rechazar cotización
     */
    public function rechazar(Cotizacion $cotizacion, string $motivo = ''): Cotizacion
    {
        if (! in_array($cotizacion->estado, ['Enviada', 'Borrador'], true)) {
            throw new \InvalidArgumentException('Solo se pueden rechazar cotizaciones activas.');
        }

        $cotizacion->update([
            'estado' => 'Rechazada',
            'observaciones' => $motivo ? trim(($cotizacion->observaciones ?: '').'
Rechazo: '.$motivo) : $cotizacion->observaciones,
        ]);

        return $cotizacion->fresh(['pedido', 'tercero', 'user']);
    }

    private function cotizacionActivaParaPedido(Pedido $pedido): ?Cotizacion
    {
        return Cotizacion::query()
            ->where('pedido_id', $pedido->id)
            ->whereIn('estado', ['Enviada', 'Borrador'])
            ->latest('created_at')
            ->first();
    }

    /**
     * Anular la cotizacion activa de un pedido.
     *
     * Regla legacy: al devolver desde Cotizado, solo la cotizacion vigente pasa a Anulada.
     * Durante En_Costeo pueden coexistir multiples cotizaciones activas.
     *
     * @return Cotizacion|null La cotizacion anulada o null si no habia activa
     */
    public function anularCotizacionActiva(Pedido $pedido, string $motivo = ''): ?Cotizacion
    {
        $cotizacionActiva = Cotizacion::query()
            ->where('pedido_id', $pedido->id)
            ->whereIn('estado', ['Enviada', 'Borrador'])
            ->latest('created_at')
            ->first();

        if (! $cotizacionActiva) {
            return null;
        }

        $observaciones = $cotizacionActiva->observaciones ?? '';
        if ($motivo !== '') {
            $observaciones = trim($observaciones."\nAnulada: ".$motivo);
        }

        $cotizacionActiva->update([
            'estado' => 'Anulada',
            'observaciones' => $observaciones,
        ]);

        return $cotizacionActiva->fresh();
    }

    /**
     * Generar PDF de la cotizacion
     */
    public function generarPDF(Cotizacion $cotizacion)
    {
        $cotizacion->load([
            'pedido.tercero.city',
            'pedido.contacto',
            'pedido.maquina',
            'pedido.maquina.listas',
            'pedido.maquina.fabricante',
            'user',
            'referenciasProveedores.pedidoReferenciaProveedor.pedidoReferencia.referencia.articulo.articuloJuegos.referencia.articulo',
            'referenciasProveedores.pedidoReferenciaProveedor.pedidoReferencia.referencia.articulo.articuloJuegos.referencia.lista',
            'referenciasProveedores.pedidoReferenciaProveedor.pedidoReferencia.referencia.articulo',
            'referenciasProveedores.pedidoReferenciaProveedor.referencia.articulo.articuloJuegos.referencia.articulo',
            'referenciasProveedores.pedidoReferenciaProveedor.referencia.articulo.articuloJuegos.referencia.lista',
            'referenciasProveedores.pedidoReferenciaProveedor.referencia.articulo',
            'referenciasProveedores.pedidoReferenciaProveedor.marca',
        ]);

        // Priorizar Heavymarket (siglas HM o ID 2)
        $empresa = Empresa::where('siglas', 'HM')->first() ?? Empresa::where('id', 2)->first() ?? Empresa::first();

        $pdf = Pdf::loadView('pdf.cotizacion', [
            'cotizacion' => $cotizacion,
            'empresa' => $empresa,
        ])->setOption('isPhpEnabled', true);

        return $pdf;
    }

    /**
     * Generar PDF de la orden de trabajo
     */
    public function generarPDFOrdenTrabajo(OrdenTrabajo $ordenTrabajo)
    {
        $ordenTrabajo->load([
            'tercero.city',
            'pedido.maquina',
            'cotizacion.user',
            'transportadora',
            'direccion',
            'referencias.pedidoReferencia.referencia.articulo',
            'referencias.pedidoReferencia.referencia.marca',
        ]);

        // Priorizar Heavymarket (siglas HM o ID 2)
        $empresa = Empresa::where('siglas', 'HM')->first() ?? Empresa::where('id', 2)->first() ?? Empresa::first();

        $pdf = Pdf::loadView('pdf.orden_trabajo', [
            'ordenTrabajo' => $ordenTrabajo,
            'empresa' => $empresa,
        ]);

        return $pdf;
    }

    /**
     * Finalizar el proceso de costeo y generar la cotización
     *
     * @param  array  $items  Seleccionados (IDs de pedido_referencia_proveedor)
     */
    public function finalizarCosteo(Pedido $pedido, array $items, int $userId, ?string $observaciones = null): Cotizacion
    {
        return DB::transaction(function () use ($pedido, $items, $userId, $observaciones) {
            $fleteConfigurado = $this->verificarFleteEnItemsSeleccionados($items);
            $estadoInicial = $fleteConfigurado ? 'Enviada' : 'Borrador';
            $observacionesNormalizadas = trim((string) ($observaciones ?? '')) ?: null;

            // 1. Crear la cotización
            $cotizacion = Cotizacion::create([
                'pedido_id' => $pedido->id,
                'tercero_id' => $pedido->tercero_id,
                'user_id' => $userId,
                'estado' => $estadoInicial,
                'fecha_emision' => now(),
                'fecha_vencimiento' => now()->addDays(15),
                'observaciones' => $observacionesNormalizadas,
            ]);

            // 2. Asociar los items seleccionados y congelar snapshot comercial
            $total = 0;
            foreach ($items as $itemData) {
                $prov = PedidoReferenciaProveedor::with([
                    'pedidoReferencia.referencia.articulo',
                    'referencia.articulo',
                    'marca',
                    'tercero',
                ])->find($itemData['id']);

                if (! $prov) {
                    continue;
                }

                CotizacionReferenciaProveedor::create(array_merge([
                    'cotizacion_id' => $cotizacion->id,
                    'pedido_referencia_proveedor_id' => $prov->id,
                    'mostrar_referencia' => $itemData['mostrar_referencia'],
                ], $this->snapshotReferenciaProveedor($prov)));

                $total += (float) ($prov->valor_total ?? 0);
            }

            $cotizacion->update(['total' => $total]);

            if (! $fleteConfigurado) {
                $this->notificarFleteFaltante($pedido, $cotizacion, $items);
            }

            return $cotizacion->fresh(['referenciasProveedores']);
        });
    }

    /**
     * @return array<string, mixed>
     */
    private function snapshotReferenciaProveedor(PedidoReferenciaProveedor $proveedor): array
    {
        $referencia = $proveedor->pedidoReferencia?->referencia ?? $proveedor->referencia;
        $articulo = $referencia?->articulo;

        return [
            'snapshot_referencia' => $referencia?->referencia,
            'snapshot_descripcion' => $articulo?->descripcionEspecifica ?? $articulo?->definicion,
            'snapshot_marca_id' => $proveedor->marca_id,
            'snapshot_marca' => $proveedor->marca?->nombre,
            'snapshot_proveedor_id' => $proveedor->proveedor_id,
            'snapshot_proveedor_nombre' => $proveedor->tercero?->nombre,
            'snapshot_entrega' => $proveedor->entrega_label,
            'snapshot_cantidad' => $proveedor->cantidad,
            'snapshot_valor_unidad' => $proveedor->valor_unidad,
            'snapshot_valor_total' => $proveedor->valor_total,
        ];
    }

    /**
     * @param  array<int, array{id: int, mostrar_referencia: bool}>  $items
     */
    private function verificarFleteEnItemsSeleccionados(array $items): bool
    {
        $pedidoService = app(PedidoService::class);

        foreach ($items as $itemData) {
            $prov = PedidoReferenciaProveedor::with('tercero.country')->find($itemData['id']);
            if (! $prov || ($prov->ubicacion ?? '') !== 'Internacional') {
                continue;
            }

            if ($pedidoService->proveedorInternacionalSinFlete($prov->proveedor_id)) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param  array<int, array{id: int, mostrar_referencia: bool}>  $items
     */
    private function notificarFleteFaltante(Pedido $pedido, Cotizacion $cotizacion, array $items): void
    {
        $pedidoService = app(PedidoService::class);
        $detalles = [];

        foreach ($items as $itemData) {
            $prov = PedidoReferenciaProveedor::with('tercero.country')->find($itemData['id']);
            if (! $prov || ($prov->ubicacion ?? '') !== 'Internacional') {
                continue;
            }
            if (! $pedidoService->proveedorInternacionalSinFlete($prov->proveedor_id)) {
                continue;
            }
            $proveedor = $prov->tercero;
            $detalles[] = ($proveedor?->nombre ?? 'Proveedor').' ('.($proveedor?->country?->name ?? 'sin país').')';
        }

        $resumen = $detalles !== []
            ? implode(', ', array_unique($detalles))
            : 'Proveedor internacional sin tarifa configurada';

        $admins = User::role('Administrador')->get();
        foreach ($admins as $admin) {
            $admin->notify(new SystemNotification(
                'missing_freight_rate',
                'Flete no configurado - Cotización #'.$cotizacion->id.' en Borrador',
                'Pedido #'.$pedido->id.': '.$resumen.'. Configure la tarifa en Gestión de Países.',
                'pi-exclamation-triangle',
                'orange',
                ['cotizacion_id' => $cotizacion->id, 'pedido_id' => $pedido->id]
            ));
        }
    }
}
