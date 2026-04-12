<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Empresa;
use App\Models\Pedido;
use App\Models\PedidoReferencia;
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
                'user', 'tercero',
                'referencias' => function ($query): void {
                    $query->withCount('imagenes')
                        ->with(['referencia.articulo', 'sistema', 'lista']);
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
                'user', 'tercero', 'maquina', 'fabricante', 'contacto',
                'referencias' => function ($query): void {
                    $query->withCount('imagenes')
                        ->with(['referencia.articulo', 'sistema', 'lista', 'imagenes', 'proveedores.tercero']);
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
            if (isset($refData['id']) && $refData['id']) {
                $referencia = $pedido->referencias()->find($refData['id']);
                if ($referencia) {
                    $referencia->update([
                        'referencia_id' => $refData['referencia_id'] ?: null,
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
                }
            } else {
                $pedido->referencias()->create([
                    'referencia_id' => $refData['referencia_id'] ?: null,
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

        if ($ubicacion === 'Internacional') {
            $empresa = Empresa::where('estado', 1)->first();
            $trm = (float) ($empresa?->trm ?? 1);
            if ($trm <= 0) {
                $trm = 1;
            } // Evitar división/multiplicación por cero o negativo

            $flete = (float) ($empresa?->flete ?? 0);

            // Obtener peso, asegurando que si no existe o es nulo, sea 0
            $referencia = $pedidoReferencia->referencia;
            $peso = (float) ($referencia->peso ?? 0);

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
        ];
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
                'pedido_creado',
                'Nuevo Pedido para Analizar #'.$pedido->id,
                'El vendedor '.$user->name.' ha creado un nuevo pedido para '.($pedido->tercero->nombre ?? 'un cliente'),
                'pi-shopping-cart',
                'orange',
                ['id' => $pedido->id]
            ));
        }
    }
}
