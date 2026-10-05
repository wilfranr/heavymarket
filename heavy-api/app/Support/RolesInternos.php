<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Roles de empleados internos de HeavyMarket (acceso a la app, no a los
 * portales de Cliente/Proveedor). Un usuario con cualquiera de estos roles
 * debe iniciar sesion unicamente por el login de la app, incluso si por
 * error (o para pruebas) tambien tiene asignado el rol Cliente o Proveedor.
 */
final class RolesInternos
{
    public const LISTA = [
        'super_admin',
        'Administrador',
        'Vendedor',
        'Gerente Comercial',
        'Analista',
        'Logistica',
        'Contabilidad',
        'panel_user',
    ];
}
