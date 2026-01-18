<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class CategoriaLanding extends Model
{
    use HasFactory;

    protected $table = 'categorias_landing';
    
    protected $fillable = ['nombre', 'descripcion_general'];

    /**
     * Relación: una categoría tiene muchas subcategorías
     */
    public function subcategorias()
    {
        return $this->hasMany(SubcategoriaLanding::class, 'categoria_id');
    }

    /**
     * Scope para obtener categorías con subcategorías limitadas (para navbar)
     */
    public function scopeConSubcategoriasLimitadas($query, $limit = 4)
    {
        return $query->with(['subcategorias' => function($q) use ($limit) {
            $q->take($limit);
        }]);
    }

    /**
     * Helper para generar slug
     */
    public function getSlugAttribute()
    {
        return Str::slug($this->nombre);
    }
}
