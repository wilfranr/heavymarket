<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\{Tercero, Contacto, Direccion};
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Servicio de lógica de negocio para Terceros
 * 
 * Maneja operaciones complejas relacionadas con
 * clientes y proveedores.
 */
class TerceroService
{
    /**
     * Crear tercero con contactos y direcciones
     * 
     * @param array<string, mixed> $data
     * @return Tercero
     */
    public function crearTerceroCompleto(array $data): Tercero
    {
        return DB::transaction(function () use ($data) {
            // Crear el tercero
            $tercero = Tercero::create([
                'tipo_documento' => $data['tipo_documento'],
                'documento' => $data['documento'],
                'razon_social' => $data['razon_social'],
                'nombre_comercial' => $data['nombre_comercial'] ?? null,
                'tipo_tercero' => $data['tipo_tercero'],
                'email' => $data['email'] ?? null,
                'telefono' => $data['telefono'] ?? null,
                'celular' => $data['celular'] ?? null,
                'direccion' => $data['direccion'] ?? null,
                'ciudad' => $data['ciudad'] ?? null,
                'pais' => $data['pais'] ?? null,
                'es_cliente' => $data['es_cliente'] ?? false,
                'es_proveedor' => $data['es_proveedor'] ?? false,
                'estado' => $data['estado'] ?? 'Activo',
            ]);

            // Agregar contactos si existen
            if (isset($data['contactos']) && is_array($data['contactos'])) {
                foreach ($data['contactos'] as $contactoData) {
                    Contacto::create([
                        'tercero_id' => $tercero->id,
                        'nombre' => $contactoData['nombre'],
                        'telefono' => $contactoData['telefono'] ?? null,
                        'email' => $contactoData['email'] ?? null,
                        'cargo' => $contactoData['cargo'] ?? null,
                    ]);
                }
            }

            // Agregar direcciones si existen
            if (isset($data['direcciones']) && is_array($data['direcciones'])) {
                foreach ($data['direcciones'] as $direccionData) {
                    Direccion::create([
                        'tercero_id' => $tercero->id,
                        'direccion' => $direccionData['direccion'],
                        'ciudad' => $direccionData['ciudad'] ?? null,
                        'departamento' => $direccionData['departamento'] ?? null,
                        'pais' => $direccionData['pais'] ?? null,
                        'es_principal' => $direccionData['es_principal'] ?? false,
                    ]);
                }
            }

            return $tercero->load(['contactos', 'direcciones']);
        });
    }

    /**
     * Buscar terceros por criterios múltiples
     * 
     * @param array<string, mixed> $criterios
     * @return Collection<int, Tercero>
     */
    public function buscar(array $criterios): Collection
    {
        $query = Tercero::query();

        if (isset($criterios['documento'])) {
            $query->where('documento', 'like', '%' . $criterios['documento'] . '%');
        }

        if (isset($criterios['razon_social'])) {
            $query->where('razon_social', 'like', '%' . $criterios['razon_social'] . '%');
        }

        if (isset($criterios['es_cliente'])) {
            $query->where('es_cliente', (bool) $criterios['es_cliente']);
        }

        if (isset($criterios['es_proveedor'])) {
            $query->where('es_proveedor', (bool) $criterios['es_proveedor']);
        }

        if (isset($criterios['estado'])) {
            $query->where('estado', $criterios['estado']);
        }

        return $query->get();
    }

    /**
     * Activar o desactivar tercero
     * 
     * @param Tercero $tercero
     * @param bool $activar
     * @return Tercero
     */
    public function cambiarEstado(Tercero $tercero, bool $activar = true): Tercero
    {
        $tercero->update([
            'estado' => $activar ? 'Activo' : 'Inactivo',
        ]);

        return $tercero;
    }

    /**
     * Obtener clientes activos
     * 
     * @return Collection<int, Tercero>
     */
    public function obtenerClientesActivos(): Collection
    {
        return Tercero::where('es_cliente', true)
            ->where('estado', 'Activo')
            ->orderBy('razon_social')
            ->get();
    }

    /**
     * Obtener proveedores activos
     * 
     * @return Collection<int, Tercero>
     */
    public function obtenerProveedoresActivos(): Collection
    {
        return Tercero::where('es_proveedor', true)
            ->where('estado', 'Activo')
            ->orderBy('razon_social')
            ->get();
    }

    /**
     * Verificar si un documento ya existe
     * 
     * @param string $documento
     * @param int|null $exceptoId
     * @return bool
     */
    public function documentoExiste(string $documento, ?int $exceptoId = null): bool
    {
        $query = Tercero::where('documento', $documento);

        if ($exceptoId) {
            $query->where('id', '!=', $exceptoId);
        }

        return $query->exists();
    }
}
