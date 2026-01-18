<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\{Pedido, PedidoReferencia, PedidoArticulo};
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

/**
 * Servicio de lógica de negocio para Pedidos
 * 
 * Contiene toda la lógica compleja relacionada con la gestión
 * de pedidos, separada de los controladores.
 */
class PedidoService
{
    /**
     * Crear un pedido completo con referencias y artículos
     * 
     * @param array<string, mixed> $data
     * @return Pedido
     * @throws \Exception
     */
    public function crearPedido(array $data): Pedido
    {
        return DB::transaction(function () use ($data) {
            // Crear el pedido principal
            $pedido = Pedido::create([
                'user_id' => $data['user_id'],
                'tercero_id' => $data['tercero_id'],
                'direccion' => $data['direccion'] ?? null,
                'comentario' => $data['comentario'] ?? null,
                'contacto_id' => $data['contacto_id'] ?? null,
                'estado' => $data['estado'] ?? 'Nuevo',
                'maquina_id' => $data['maquina_id'] ?? null,
                'fabricante_id' => $data['fabricante_id'] ?? null,
            ]);

            // Agregar referencias si existen
            if (isset($data['referencias']) && is_array($data['referencias'])) {
                $this->agregarReferencias($pedido, $data['referencias']);
            }

            // Agregar artículos si existen
            if (isset($data['articulos']) && is_array($data['articulos'])) {
                $this->agregarArticulos($pedido, $data['articulos']);
            }

            return $pedido->load(['user', 'tercero', 'referencias', 'articulos']);
        });
    }

    /**
     * Actualizar el estado de un pedido
     * 
     * @param Pedido $pedido
     * @param string $nuevoEstado
     * @param string|null $motivoRechazo
     * @return Pedido
     */
    public function cambiarEstado(
        Pedido $pedido,
        string $nuevoEstado,
        ?string $motivoRechazo = null
    ): Pedido {
        $pedido->update([
            'estado' => $nuevoEstado,
            'motivo_rechazo' => $nuevoEstado === 'Rechazado' ? $motivoRechazo : null,
        ]);

        // Aquí se podría disparar un evento
        // event(new PedidoEstadoCambiado($pedido));

        return $pedido;
    }

    /**
     * Calcular el total de un pedido
     * 
     * @param Pedido $pedido
     * @return float
     */
    public function calcularTotal(Pedido $pedido): float
    {
        $totalReferencias = $pedido->referencias->sum(function ($item) {
            return $item->cantidad * ($item->precio_unitario ?? 0);
        });

        $totalArticulos = $pedido->articulos->sum(function ($item) {
            return $item->cantidad * ($item->precio_unitario ?? 0);
        });

        return $totalReferencias + $totalArticulos;
    }

    /**
     * Obtener pedidos pendientes de un tercero
     * 
     * @param int $terceroId
     * @return Collection<int, Pedido>
     */
    public function obtenerPedidosPendientes(int $terceroId): Collection
    {
        return Pedido::where('tercero_id', $terceroId)
            ->whereIn('estado', ['Nuevo', 'Enviado', 'En_Costeo'])
            ->with(['referencias', 'articulos'])
            ->get();
    }

    /**
     * Agregar referencias al pedido
     * 
     * @param Pedido $pedido
     * @param array<int, array<string, mixed>> $referencias
     * @return void
     */
    private function agregarReferencias(Pedido $pedido, array $referencias): void
    {
        foreach ($referencias as $referencia) {
            PedidoReferencia::create([
                'pedido_id' => $pedido->id,
                'referencia_id' => $referencia['referencia_id'],
                'cantidad' => $referencia['cantidad'],
                'precio_unitario' => $referencia['precio_unitario'] ?? null,
            ]);
        }
    }

    /**
     * Agregar artículos al pedido
     * 
     * @param Pedido $pedido
     * @param array<int, array<string, mixed>> $articulos
     * @return void
     */
    private function agregarArticulos(Pedido $pedido, array $articulos): void
    {
        foreach ($articulos as $articulo) {
            PedidoArticulo::create([
                'pedido_id' => $pedido->id,
                'articulo_id' => $articulo['articulo_id'],
                'cantidad' => $articulo['cantidad'],
                'precio_unitario' => $articulo['precio_unitario'] ?? null,
            ]);
        }
    }

    /**
     * Duplicar un pedido existente
     * 
     * @param Pedido $pedidoOriginal
     * @param int $userId
     * @return Pedido
     */
    public function duplicarPedido(Pedido $pedidoOriginal, int $userId): Pedido
    {
        return DB::transaction(function () use ($pedidoOriginal, $userId) {
            // Crear nuevo pedido basado en el original
            $nuevoPedido = Pedido::create([
                'user_id' => $userId,
                'tercero_id' => $pedidoOriginal->tercero_id,
                'direccion' => $pedidoOriginal->direccion,
                'comentario' => 'Duplicado de pedido #' . $pedidoOriginal->id,
                'contacto_id' => $pedidoOriginal->contacto_id,
                'estado' => 'Nuevo',
                'maquina_id' => $pedidoOriginal->maquina_id,
                'fabricante_id' => $pedidoOriginal->fabricante_id,
            ]);

            // Copiar referencias
            foreach ($pedidoOriginal->referencias as $referencia) {
                PedidoReferencia::create([
                    'pedido_id' => $nuevoPedido->id,
                    'referencia_id' => $referencia->referencia_id,
                    'cantidad' => $referencia->cantidad,
                    'precio_unitario' => $referencia->precio_unitario,
                ]);
            }

            // Copiar artículos
            foreach ($pedidoOriginal->articulos as $articulo) {
                PedidoArticulo::create([
                    'pedido_id' => $nuevoPedido->id,
                    'articulo_id' => $articulo->articulo_id,
                    'cantidad' => $articulo->cantidad,
                    'precio_unitario' => $articulo->precio_unitario,
                ]);
            }

            return $nuevoPedido->load(['referencias', 'articulos']);
        });
    }
}
