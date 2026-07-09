<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\PedidoOrigen;
use App\Models\Country;
use App\Models\Empresa;
use App\Models\Pedido;
use App\Models\PedidoReferencia;
use App\Models\Referencia;
use App\Models\Tercero;
use App\Models\TRM;
use App\Models\User;
use App\Notifications\SystemNotification;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

/**
 * Servicio de Pedidos
 *
 * Centraliza la lógica de negocio para la gestión de pedidos,
 * incluyendo cálculos de TRM, fletes y sincronización de referencias.
 */
class PedidoService
{
    /**
     * Crear un nuevo pedido con sus referencias y artículos
     *
     * @throws \Exception
     */
    public function create(array $data, User $user): Pedido
    {
        return DB::transaction(function () use ($data, $user) {
            $pedido = Pedido::create([
                'user_id' => $user->id,
                'origen' => PedidoOrigen::Panel,
                'tercero_id' => $data['tercero_id'],
                'direccion' => $data['direccion'] ?? null,
                'comentario' => $data['comentario'] ?? null,
                'contacto_id' => $data['contacto_id'] ?? null,
                'estado' => $data['estado'] ?? 'Nuevo',
                'maquina_id' => $data['maquina_id'] ?? null,
                'fabricante_id' => $data['fabricante_id'] ?? null,
            ]);

            // Agregar referencias si existen
            if (isset($data['referencias'])) {
                foreach ($data['referencias'] as $index => $refData) {
                    $referencia = $pedido->referencias()->create([
                        'referencia_id' => $refData['referencia_id'] ?? null,
                        'sistema_id' => $refData['sistema_id'] ?? null,
                        'lista_id' => $refData['lista_id'] ?? null,
                        'marca_id' => $refData['marca_id'] ?? null,
                        'definicion' => $refData['definicion'] ?? null,
                        'cantidad' => $refData['cantidad'] ?? 1,
                        'comentario' => $refData['comentario'] ?? null,
                        'imagen' => $refData['imagen'] ?? null,
                        'mostrar_referencia' => filter_var($refData['mostrar_referencia'] ?? true, FILTER_VALIDATE_BOOLEAN),
                        'estado' => filter_var($refData['estado'] ?? true, FILTER_VALIDATE_BOOLEAN),
                    ]);

                    // Las imágenes se manejarán mediante el request original si se pasan como archivos
                    // El servicio asume que si hay archivos, se procesan externamente o se pasan rutas
                }
            }

            // Agregar artículos si existen
            if (isset($data['articulos'])) {
                foreach ($data['articulos'] as $artData) {
                    $pedido->articulos()->create([
                        'articulo_id' => $artData['articulo_id'],
                        'cantidad' => $artData['cantidad'],
                        'precio_unitario' => $artData['precio_unitario'] ?? null,
                    ]);
                }
            }

            $this->notifyNewOrder($pedido, $user);

            return $pedido->load([
                'user', 'tercero', 'maquina.fabricante', 'maquina.listas', 'maquina.componentes.marca', 'maquina.componentes.sistema',
                'referencias' => function ($query): void {
                    $query->withCount('imagenes')
                        ->with(['referencia.articulo.referencias.marca', 'referencia.articulo.medidas', 'referencia.articulo.piezaEstandar', 'referencia.articulo.articuloJuegos.referencia.articulo', 'referencia.articuloJuegos.articulo', 'sistema', 'lista']);
                },
                'articulos',
            ]);
        });
    }

    /**
     * Actualizar un pedido existente
     */
    public function update(Pedido $pedido, array $data): Pedido
    {
        return DB::transaction(function () use ($pedido, $data) {
            $attributes = Arr::only($data, $pedido->getFillable());
            $pedido->update($attributes);

            if (isset($data['referencias'])) {
                $this->syncReferencias($pedido, $data['referencias']);
            }

            return $pedido->load([
                'user', 'tercero', 'maquina.fabricante', 'maquina.listas', 'maquina.componentes.marca', 'maquina.componentes.sistema', 'fabricante', 'contacto',
                'referencias' => function ($query): void {
                    $query->withCount('imagenes')
                        ->with(['referencia.articulo.referencias.marca', 'referencia.articulo.medidas', 'referencia.articulo.piezaEstandar', 'referencia.articulo.articuloJuegos.referencia.articulo', 'referencia.articuloJuegos.articulo', 'sistema', 'lista', 'imagenes', 'proveedores.tercero']);
                },
                'articulos.articulo', 'articulos.sistema',
            ]);
        });
    }

    /**
     * Sincroniza las referencias de un pedido
     */
    public function syncReferencias(Pedido $pedido, array $referenciasData): void
    {
        $currentIds = $pedido->referencias()->pluck('id')->toArray();
        $incomingIds = [];

        foreach ($referenciasData as $refData) {
            if (isset($refData['id']) && $refData['id']) {
                $incomingIds[] = $refData['id'];
            }
        }

        $toDelete = array_diff($currentIds, $incomingIds);
        if (! empty($toDelete)) {
            $pedido->referencias()->whereIn('id', $toDelete)->delete();
        }

        foreach ($referenciasData as $refData) {
            $referenciaCatalogoId = $refData['referencia_id'] ?? null;
            $marcaId = $refData['marca_id'] ?? null;

            // Si se selecciona una referencia de catálogo y no se especifica marca, heredar la del catálogo
            if ($referenciaCatalogoId && empty($marcaId)) {
                $refCatalogo = Referencia::find($referenciaCatalogoId);
                if ($refCatalogo && $refCatalogo->marca_id) {
                    $marcaId = $refCatalogo->marca_id;
                }
            }

            $catIds = $refData['categoria_comercial_ids'] ?? [];

            if (isset($refData['id']) && $refData['id']) {
                $referencia = $pedido->referencias()->find($refData['id']);
                if ($referencia) {
                    $referencia->update([
                        'referencia_id' => $referenciaCatalogoId ?: null,
                        'sistema_id' => $refData['sistema_id'] ?? null,
                        'lista_id' => $refData['lista_id'] ?? null,
                        'marca_id' => $marcaId,
                        'definicion' => $refData['definicion'] ?? null,
                        'cantidad' => $refData['cantidad'] ?? 1,
                        'comentario' => $refData['comentario'] ?? null,
                        'imagen' => $refData['imagen'] ?? null,
                        'categoria_comercial_id' => $refData['categoria_comercial_id'] ?? null,
                        'mostrar_referencia' => filter_var($refData['mostrar_referencia'] ?? true, FILTER_VALIDATE_BOOLEAN),
                        'estado' => filter_var($refData['estado'] ?? true, FILTER_VALIDATE_BOOLEAN),
                    ]);
                    $referencia->categoriasComerciales()->sync($catIds);
                }
            } else {
                $newReferencia = $pedido->referencias()->create([
                    'referencia_id' => $referenciaCatalogoId ?: null,
                    'sistema_id' => $refData['sistema_id'] ?? null,
                    'lista_id' => $refData['lista_id'] ?? null,
                    'marca_id' => $marcaId,
                    'definicion' => $refData['definicion'] ?? null,
                    'cantidad' => $refData['cantidad'] ?? 1,
                    'comentario' => $refData['comentario'] ?? null,
                    'imagen' => $refData['imagen'] ?? null,
                    'categoria_comercial_id' => $refData['categoria_comercial_id'] ?? null,
                    'mostrar_referencia' => filter_var($refData['mostrar_referencia'] ?? true, FILTER_VALIDATE_BOOLEAN),
                    'estado' => filter_var($refData['estado'] ?? true, FILTER_VALIDATE_BOOLEAN),
                ]);
                $newReferencia->categoriasComerciales()->sync($catIds);
            }
        }
    }

    /**
     * Calcula los valores de unidad y total según ubicación (Nacional/Internacional)
     */
    public function calcularValores(array $datos, PedidoReferencia $pedidoReferencia): array
    {
        $costo_unidad = (float) ($datos['costo_unidad'] ?? 0);
        $utilidad = (float) ($datos['utilidad'] ?? 0);
        $cantidad = (int) ($datos['cantidad'] ?? 1);
        $ubicacion = $datos['ubicacion'] ?? 'Nacional';

        $proveedorId = isset($datos['proveedor_id']) ? (int) $datos['proveedor_id'] : null;
        $missingFreightRate = false;
        $fleteUsado = null;

        if ($ubicacion === 'Internacional') {
            $trmRegistro = TRM::orderBy('fecha', 'desc')->first();
            $trm = $trmRegistro ? (float) $trmRegistro->trm : 1.0;
            if ($trm <= 0) {
                $trm = 1.0;
            }

            $flete = $this->obtenerFleteDesdeProveedor($proveedorId);
            $fleteUsado = $flete;
            $missingFreightRate = $this->proveedorInternacionalSinFlete($proveedorId);

            $referencia = $pedidoReferencia->referencia;
            if ($referencia) {
                $referencia->loadMissing('articulo');
            }
            $peso = (float) ($referencia?->articulo?->peso ?? 0);

            $peso_libras = $peso / 453.592;
            $costo_base_usd = ($peso_libras * $flete) + $costo_unidad;
            $costo_base_cop = $costo_base_usd * $trm;

            $valor_unidad = $costo_base_cop + ($utilidad * $costo_base_cop / 100);
            $valor_unidad = round($valor_unidad, -2);
        } else {
            $valor_unidad = $costo_unidad + ($costo_unidad * $utilidad / 100);
            $valor_unidad = round($valor_unidad);
        }

        return [
            'valor_unidad' => $valor_unidad,
            'valor_total' => $valor_unidad * $cantidad,
            'flete_usado' => $fleteUsado,
            'missing_freight_rate' => $missingFreightRate,
        ];
    }

    public function esProveedorNacional(?int $proveedorId): bool
    {
        if (! $proveedorId) {
            return true;
        }

        $tercero = Tercero::with('country')->find($proveedorId);
        if (! $tercero || ! $tercero->country_id) {
            return true;
        }

        return Country::esColombia($tercero->country_id, $tercero->country?->iso2);
    }

    public function obtenerFleteDesdeProveedor(?int $proveedorId): float
    {
        if ($this->esProveedorNacional($proveedorId)) {
            return 0.0;
        }

        $tercero = Tercero::with('country')->find($proveedorId);

        return (float) ($tercero?->country?->flete ?? 0);
    }

    public function proveedorInternacionalSinFlete(?int $proveedorId): bool
    {
        return ! $this->esProveedorNacional($proveedorId)
            && $this->obtenerFleteDesdeProveedor($proveedorId) <= 0;
    }

    public function ubicacionDesdeProveedor(?int $proveedorId): string
    {
        return $this->esProveedorNacional($proveedorId) ? 'Nacional' : 'Internacional';
    }

    /**
     * Envía notificaciones de nuevo pedido
     */
    private function notifyNewOrder(Pedido $pedido, User $user): void
    {
        // Notificación al creador
        $user->notify(new SystemNotification(
            'pedido_creado',
            'Nuevo Pedido #'.$pedido->id,
            'Se ha creado el pedido para '.($pedido->tercero->nombre ?? 'cliente').' exitosamente.',
            'pi-shopping-cart',
            'blue',
            ['id' => $pedido->id]
        ));

        // Notificación a analistas
        $analistas = User::role('Analista')->get();
        foreach ($analistas as $analista) {
            $analista->notify(new SystemNotification(
                'pedido_en_analisis',
                'Pedido #'.$pedido->id.' enviado a Análisis',
                'El vendedor '.$user->name.' ha enviado el pedido #'.$pedido->id.' para análisis.',
                'pi-search',
                'blue',
                ['id' => $pedido->id, 'tercero_id' => $pedido->tercero_id]
            ));
        }
    }
}
