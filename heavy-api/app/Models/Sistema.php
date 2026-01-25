<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sistema extends Model
{
    use HasFactory;
    use SoftDeletes;
    
    protected $fillable = [
        'nombre',
        'descripcion',
        'imagen',
    ];

    public function getImagenAttribute($value): ?string
    {
        if (str_starts_with($value ?? '', 'http')) {
            return $value;
        }

        $folder = '04. Sistemas';

        // 1. Intentar con valor de DB
        if ($value && file_exists(storage_path("app/public/Aplicativo/{$folder}/{$value}"))) {
            return asset("storage/Aplicativo/{$folder}/{$value}");
        }

        // 2. Intentar con patrón Sis[Nombre].png
        $nameClean = str_replace([' ', '-', '.'], '', $this->nombre);
        $patternName = "Sis{$nameClean}.png";

        if (file_exists(storage_path("app/public/Aplicativo/{$folder}/{$patternName}"))) {
            return asset("storage/Aplicativo/{$folder}/{$patternName}");
        }

        // 3. Fallback
        return $value ? asset("storage/Aplicativo/{$folder}/{$value}") : null;
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