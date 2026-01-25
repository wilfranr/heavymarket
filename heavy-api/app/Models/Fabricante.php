<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Fabricante extends Model
{
    use HasFactory;
    protected $table = 'fabricantes';

    protected $fillable = [

        'nombre',
        'descripcion',
        'logo'

    ];

    public function getLogoAttribute($value): ?string
    {
        if (str_starts_with($value ?? '', 'http')) {
            return $value;
        }

        // 1. Intentar con el valor de la base de datos si existe físicamente
        if ($value && file_exists(storage_path("app/public/Aplicativo/01. Fabricantes/{$value}"))) {
            return asset("storage/Aplicativo/01. Fabricantes/{$value}");
        }

        // 2. Intentar con el patrón fab-[slug].png basado en el nombre
        $nameSlug = str_replace([' ', '-', '.'], '', strtolower($this->nombre));
        $patternName = "fab-{$nameSlug}.png";

        if (file_exists(storage_path("app/public/Aplicativo/01. Fabricantes/{$patternName}"))) {
            return asset("storage/Aplicativo/01. Fabricantes/{$patternName}");
        }

        // 3. Fallback original
        return $value ? asset("storage/Aplicativo/01. Fabricantes/{$value}") : null;
    }



    // public function referencias(): HasMany
    // {
    //     return $this->hasMany(Referencia::class, 'marca_id');
    // }

    public function maquinas(): HasMany
    {
        return $this->hasMany(Maquina::class, 'fabricante_id');
    }

    public function terceros(): BelongsToMany
    {
        return $this->belongsToMany(Tercero::class, 'tercero_fabricantes', 'fabricante_id', 'tercero_id');
    }
}
