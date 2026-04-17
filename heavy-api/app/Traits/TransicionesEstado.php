<?php

declare(strict_types=1);

namespace App\Traits;

use App\Enums\PedidoEstado;
use InvalidArgumentException;

/**
 * Trait para gestionar transiciones de estado en modelos
 * 
 * Proporciona métodos para validar y ejecutar transiciones de estado
 * según las reglas definidas en el enum PedidoEstado.
 */
trait TransicionesEstado
{
    /**
     * Columna que almacena el estado (override en el modelo si es diferente)
     */
    protected string $columnaEstado = 'estado';

    /**
     * Obtiene el estado actual como enum
     */
    public function getEstadoEnum(): PedidoEstado
    {
        $estado = $this->{$this->columnaEstado};
        
        if ($estado instanceof PedidoEstado) {
            return $estado;
        }

        return PedidoEstado::from($estado);
    }

    /**
     * Obtiene el valor string del estado actual
     */
    public function getEstado(): string
    {
        return $this->{$this->columnaEstado};
    }

    /**
     * Verifica si el modelo puede transitar a un estado destino
     */
    public function puedeTransitarA(PedidoEstado $destino): bool
    {
        return $this->getEstadoEnum()->puedeTransitarA($destino);
    }

    /**
     * Transita el modelo a un nuevo estado
     * 
     * @throws InvalidArgumentException Si la transición no es válida
     */
    public function transitarA(PedidoEstado $nuevoEstado, ?string $motivo = null): bool
    {
        $estadoActual = $this->getEstadoEnum();

        if (! $estadoActual->puedeTransitarA($nuevoEstado)) {
            throw new InvalidArgumentException(
                sprintf(
                    'Transición inválida de "%s" a "%s". Estados válidos: %s',
                    $estadoActual->value,
                    $nuevoEstado->value,
                    implode(', ', array_map(
                        fn(PedidoEstado $e) => $e->value,
                        $estadoActual->transicionesValidas()
                    ))
                )
            );
        }

        $this->{$this->columnaEstado} = $nuevoEstado->value;

        // Si hay motivo (para rechazos), guardarlo
        if ($motivo && $nuevoEstado === PedidoEstado::Rechazado) {
            if (method_exists($this, 'setAttribute') && in_array('motivo_rechazo', $this->getFillable() ?? [])) {
                $this->motivo_rechazo = $motivo;
            }
        }

        return true;
    }

    /**
     * Obtiene las transiciones válidas desde el estado actual
     * @return array<int, PedidoEstado>
     */
    public function getTransicionesValidas(): array
    {
        return $this->getEstadoEnum()->transicionesValidas();
    }

    /**
     * Obtiene los estados como array para validación de formularios
     * @return array<int, string>
     */
    public static function getEstadosPermitidos(): array
    {
        return PedidoEstado::toArray();
    }

    /**
     * Obtiene el label del estado actual
     */
    public function getEstadoLabel(): string
    {
        return $this->getEstadoEnum()->label();
    }
}