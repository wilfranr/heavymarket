<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sistema extends Model
{
    use \App\Traits\NormalizesResources, HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'nombre',
        'descripcion',
        'imagen',
    ];

    protected $normalizableAttributes = [
        'nombre' => 'title',
        'descripcion' => 'sentence',
    ];

    public function getImagenAttribute($value): ?string
    {
        if (! $value) {
            return null;
        }

        if (str_starts_with($value, 'http')) {
            return $value;
        }

        // 0. Si contiene una ruta explícita (e.g. 'sistemas/abc.jpg'), usarla directamente
        if (str_contains($value, '/')) {
            return \Illuminate\Support\Facades\Storage::disk('public')->url($value);
        }

        $folder = '04. Sistemas';

        // 1. Intentar buscar el valor exacto en la carpeta de sistemas (legado)
        if (file_exists(storage_path("app/public/Aplicativo/{$folder}/{$value}"))) {
            return \Illuminate\Support\Facades\Storage::disk('public')->url("Aplicativo/{$folder}/{$value}");
        }

        // 2. Intentar con patrón Sis[Nombre].png como fallback (legado)
        $nameClean = str_replace([' ', '-', '.'], '', $this->nombre);
        $patternName = "Sis{$nameClean}.png";

        if (file_exists(storage_path("app/public/Aplicativo/{$folder}/{$patternName}"))) {
            return \Illuminate\Support\Facades\Storage::disk('public')->url("Aplicativo/{$folder}/{$patternName}");
        }

        // 3. Fallback final
        return \Illuminate\Support\Facades\Storage::disk('public')->url($value);
    }

    public function terceros(): BelongsToMany
    {
        return $this->belongsToMany(Tercero::class, 'tercero_sistemas', 'sistema_id', 'tercero_id');
    }

    public function listas(): BelongsToMany
    {
        return $this->belongsToMany(Lista::class, 'sistema_lista', 'sistema_id', 'lista_id');
    }
}
