<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lista extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'tipo',
        'nombre',
        'definicion',
        'foto',
        'fotoMedida',
        'sistema_id',
    ];
    
    public function sistemas(): BelongsToMany
    {
        return $this->belongsToMany(Sistema::class, 'sistema_lista', 'lista_id', 'sistema_id');
    }
    
    public function getFotoAttribute($value): ?string
    {
        if (str_starts_with($value ?? '', 'http')) {
            return $value;
        }

        $folder = match ($this->tipo) {
            'Tipo de Artículo' => '05. Articulos',
            'Marca' => '02. Marcas Repuestos',
            'Tipo de Medida' => '06. Tipos de Medida',
            'Unidad de Medida' => '07. Unidad de Medida',
            'Tipo de Máquina' => '03. Tipos de Maquina',
            default => null
        };

        if (!$folder) {
            return $value;
        }

        // 1. Intentar con el valor de la base de datos
        if ($value && file_exists(storage_path("app/public/Aplicativo/{$folder}/{$value}"))) {
            return asset("storage/Aplicativo/{$folder}/{$value}");
        }

        // 2. Intentar con patrón específico por tipo
        $nameSlug = str_replace([' ', '-', '.'], '', strtolower($this->nombre));
        
        $patterns = [];
        if ($this->tipo === 'Marca') {
            $patterns[] = "marca-{$nameSlug}.png";
            $patterns[] = "marca-{$nameSlug}.jpg";
            $patterns[] = "{$this->nombre}.png";
            $patterns[] = "{$this->nombre}.jpg";
        } elseif ($this->tipo === 'Tipo de Máquina') {
            $patterns[] = "maq-{$nameSlug}.png";
            $patterns[] = "{$nameSlug}.png";
        }

        foreach ($patterns as $pattern) {
            if (file_exists(storage_path("app/public/Aplicativo/{$folder}/{$pattern}"))) {
                return asset("storage/Aplicativo/{$folder}/{$pattern}");
            }
        }

        // 3. Fallback
        return $value ? asset("storage/Aplicativo/{$folder}/{$value}") : null;
    }

    public function getNombreAttribute($value): string
    {
        return ucfirst($value); // Asegura que siempre tenga la primera letra en mayúscula
    }
}