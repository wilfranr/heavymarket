<?php

declare(strict_types=1);

namespace App\Enums;

use BackedEnum;
use UnitEnum;

/**
 * Enum de Estados de Pedido con transiciones válidas
 * 
 * Define el ciclo de vida completo de un pedido:
 * Borrador → Nuevo → En_Analisis / En_Costeo → Cotizado → Aprobado | Rechazado
 */
enum PedidoEstado: string
{
    case Borrador = 'Borrador';
    case Nuevo = 'Nuevo';
    case En_Analisis = 'En_Analisis';
    case En_Costeo = 'En_Costeo';
    case Cotizado = 'Cotizado';
    case Aprobado = 'Aprobado';
    case Rechazado = 'Rechazado';
    case Enviado = 'Enviado';
    case Entregado = 'Entregado';
    case Cancelado = 'Cancelado';

    /**
     * Transiciones válidas desde este estado
     * @return array<int, PedidoEstado>
     */
    public function transicionesValidas(): array
    {
        return match ($this) {
            self::Borrador => [
                self::Nuevo,
                self::En_Analisis,
                self::Cancelado,
            ],
            self::Nuevo => [
                self::En_Analisis,
                self::En_Costeo,
                self::Cancelado,
            ],
            self::En_Analisis => [
                self::En_Costeo,
                self::Cotizado,
                self::Nuevo,  // Devolver al vendedor
                self::Cancelado,
            ],
            self::En_Costeo => [
                self::Cotizado,
                self::En_Analisis, // Devolver al analista
                self::Cancelado,
            ],
            self::Cotizado => [
                self::Aprobado,
                self::Rechazado,
                self::Cancelado,
            ],
            self::Aprobado => [
                self::Enviado,
                self::Cancelado,
            ],
            self::Enviado => [
                self::Entregado,
                self::Cancelado,
            ],
            self::Entregado, 
            self::Rechazado, 
            self::Cancelado => [], // Estados finales, sin transiciones
        };
    }

    /**
     * Verifica si se puede transitar a un estado destino
     */
    public function puedeTransitarA(PedidoEstado $destino): bool
    {
        return in_array($destino, $this->transicionesValidas(), true);
    }

    /**
     * Obtiene el label para mostrar en UI
     */
    public function label(): string
    {
        return match ($this) {
            self::Borrador => 'Borrador',
            self::Nuevo => 'Nuevo',
            self::En_Analisis => 'En Análisis',
            self::En_Costeo => 'En Costeo',
            self::Cotizado => 'Cotizado',
            self::Aprobado => 'Aprobado',
            self::Rechazado => 'Rechazado',
            self::Enviado => 'Enviado',
            self::Entregado => 'Entregado',
            self::Cancelado => 'Cancelado',
        };
    }

    /**
     * Obtiene todos los estados posibles
     * @return array<int, PedidoEstado>
     */
    public static function todos(): array
    {
        return [
            self::Borrador,
            self::Nuevo,
            self::En_Analisis,
            self::En_Costeo,
            self::Cotizado,
            self::Aprobado,
            self::Rechazado,
            self::Enviado,
            self::Entregado,
            self::Cancelado,
        ];
    }

    /**
     * Obtiene los estados como array de strings para validación
     * @return array<int, string>
     */
    public static function toArray(): array
    {
        return array_map(fn(PedidoEstado $e) => $e->value, self::todos());
    }

    /**
     * Estados iniciales (desde los cuales se puede crear un pedido)
     * @return array<int, PedidoEstado>
     */
    public static function estadosIniciales(): array
    {
        return [
            self::Borrador,
            self::Nuevo,
            self::En_Analisis, // Permite enviar directamente a análisis (frontend valida máquina revisada)
        ];
    }

    /**
     * Estados que requieren máquina revisada para transitar
     * @return array<int, PedidoEstado>
     */
    public static function estadosQueRequierenMaquinaRevisada(): array
    {
        return [
            self::En_Analisis,
        ];
    }
}