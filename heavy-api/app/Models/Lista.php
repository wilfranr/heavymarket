<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lista extends Model
{
    use \App\Traits\NormalizesResources, HasFactory, SoftDeletes;

    protected $fillable = [
        'tipo',
        'nombre',
        'definicion',
        'foto',
        'fotoMedida',
        'sistema_id',
        'parent_id',
        'fabricante_id',
    ];

    protected $normalizableAttributes = [
        'nombre' => 'title',
        'definicion' => 'title',
    ];

    public function sistemas(): BelongsToMany
    {
        return $this->belongsToMany(Sistema::class, 'sistema_lista', 'lista_id', 'sistema_id');
    }

    public function parent()
    {
        return $this->belongsTo(Lista::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Lista::class, 'parent_id');
    }

    public function fabricante(): BelongsTo
    {
        return $this->belongsTo(Fabricante::class, 'fabricante_id');
    }

    public function esCatalogoFabricantes(): bool
    {
        return $this->tipo === 'Fabricantes';
    }

    /**
     * Mantiene una fila en listas (tipo Fabricantes) alineada con el registro maestro en fabricantes.
     */
    public static function syncFromFabricante(Fabricante $fabricante): Lista
    {
        $attrs = $fabricante->getAttributes();
        $logoRaw = $attrs['logo'] ?? null;

        $lista = static::withTrashed()->firstOrNew([
            'tipo' => 'Fabricantes',
            'fabricante_id' => $fabricante->id,
        ]);

        $lista->fill([
            'nombre' => $attrs['nombre'] ?? $fabricante->nombre,
            'definicion' => $attrs['descripcion'] ?? null,
            'foto' => $logoRaw,
            'fotoMedida' => null,
        ]);

        if ($lista->trashed()) {
            $lista->restore();
        }

        $lista->save();

        return $lista;
    }

    public function getFotoAttribute($value): ?string
    {
        if (! $value) {
            return null;
        }

        if (str_starts_with($value, 'http')) {
            return $value;
        }

        $fabricante = $this->fabricante;
        if ($fabricante) {
            $nameSlug = str_replace([' ', '-', '.'], '', strtolower($fabricante->nombre));
            $patternName = "fab-{$nameSlug}.png";

            if (file_exists(storage_path("app/public/Aplicativo/01. Fabricantes/{$patternName}"))) {
                return \Illuminate\Support\Facades\Storage::disk('public')->url("Aplicativo/01. Fabricantes/{$patternName}");
            }
        }

        if (file_exists(storage_path("app/public/Aplicativo/01. Fabricantes/{$value}"))) {
            return \Illuminate\Support\Facades\Storage::disk('public')->url("Aplicativo/01. Fabricantes/{$value}");
        }

        if (str_contains($value, '/')) {
            return \Illuminate\Support\Facades\Storage::disk('public')->url($value);
        }

        return \Illuminate\Support\Facades\Storage::disk('public')->url($value);
    }

    public function getNombreAttribute($value): string
    {
        return ucfirst($value); // Asegura que siempre tenga la primera letra en mayúscula
    }
}
