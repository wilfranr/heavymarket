<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Fabricante extends Model
{
    use \App\Traits\NormalizesResources, HasFactory;

    protected $table = 'fabricantes';

    protected $fillable = [

        'nombre',
        'descripcion',
        'logo',

    ];

    protected $normalizableAttributes = [
        'nombre' => 'title',
        'descripcion' => 'sentence',
    ];

    public function getLogoAttribute($value): ?string
    {
        if (! $value) {
            return null;
        }

        if (str_starts_with($value, 'http')) {
            return $value;
        }

        if (str_contains($value, '/')) {
            return \Illuminate\Support\Facades\Storage::disk('public')->url($value);
        }

        if (file_exists(storage_path("app/public/Aplicativo/01. Fabricantes/{$value}"))) {
            return \Illuminate\Support\Facades\Storage::disk('public')->url("Aplicativo/01. Fabricantes/{$value}");
        }

        $nameSlug = str_replace([' ', '-', '.'], '', strtolower($this->nombre));
        $patternName = "fab-{$nameSlug}.png";

        if (file_exists(storage_path("app/public/Aplicativo/01. Fabricantes/{$patternName}"))) {
            return \Illuminate\Support\Facades\Storage::disk('public')->url("Aplicativo/01. Fabricantes/{$patternName}");
        }

        return \Illuminate\Support\Facades\Storage::disk('public')->url("Aplicativo/01. Fabricantes/{$value}");
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

    public function listas(): HasMany
    {
        return $this->hasMany(Lista::class, 'fabricante_id');
    }
}
