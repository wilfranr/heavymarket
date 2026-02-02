<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SubcategoriaLanding extends Model
{
    use HasFactory;

    protected $table = 'subcategorias_landing';
    
    protected $fillable = ['categoria_id', 'nombre', 'descripcion', 'imagen', 'mostrar_en_navbar', 'orden_navbar'];
    
    protected $casts = [
        'mostrar_en_navbar' => 'boolean',
    ];
    
    protected $appends = ['slug', 'imagen_url'];

    protected static function booted()
    {
        static::saving(function ($subcategoria) {
            if ($subcategoria->mostrar_en_navbar) {
                // Contar cuántas subcategorías de la MISMA categoría ya están activas (excluyendo la actual si es update)
                $count = static::where('categoria_id', $subcategoria->categoria_id)
                    ->where('mostrar_en_navbar', true)
                    ->where('id', '!=', $subcategoria->id)
                    ->count();
                
                if ($count >= 4) {
                    throw new \Exception('Solo se pueden seleccionar hasta 4 subcategorías por categoría para el mega menú.');
                }
            }
        });
    }

    /**
     * Relación: una subcategoría pertenece a una categoría
     */
    public function categoria()
    {
        return $this->belongsTo(CategoriaLanding::class, 'categoria_id');
    }

    /**
     * Helper para generar slug
     */
    public function getSlugAttribute()
    {
        return Str::slug($this->nombre);
    }

    /**
     * Helper para obtener la URL completa de la imagen
     */
    public function getImagenUrlAttribute()
    {
        $imagen = $this->getRawOriginal('imagen') ?: null;
        
        // Si no hay imagen en DB, buscar en el config
        if (!$imagen) {
            $map = config('productos_imagenes');
            $imagen = is_array($map) ? ($map[$this->slug] ?? ($map['default'] ?? 'no-image.png')) : 'no-image.png';
        }

        if (Str::startsWith($imagen, ['http://', 'https://'])) {
            return $imagen;
        }

        // Si es una ruta de storage (nueva estructura)
        if (Str::startsWith($imagen, ['landing/', 'listas/'])) {
            return asset('storage/' . $imagen);
        }

        // Si ya trae el prefijo storage/
        if (Str::startsWith($imagen, 'storage/')) {
            return asset($imagen);
        }

        // Por defecto, si es solo el nombre del archivo, está en public/images/
        return asset('images/' . $imagen);
    }
    
    /**
     * Accessor para obtener la imagen por defecto si es null
     */
    public function getImagenAttribute($value)
    {
        if (!$value) {
            $map = config('productos_imagenes');
            return is_array($map) ? ($map[$this->slug] ?? ($map['default'] ?? 'no-image.png')) : 'no-image.png';
        }
        
        return $value;
    }
}
