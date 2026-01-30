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
        $imagen = $this->imagen;
        
        if ($imagen) {
            if (Str::startsWith($imagen, ['http://', 'https://'])) {
                return $imagen;
            }
            
            // Si empieza con landing/, es del storage
            if (Str::startsWith($imagen, 'landing/')) {
                return asset('storage/' . $imagen);
            }
            
            return asset($imagen);
        }
        
        // Fallback al mapeo del config
        $map = config('productos_imagenes');
        if (is_array($map)) {
            $imageName = $map[$this->slug] ?? ($map['default'] ?? 'no-image.png');
            
            if (Str::startsWith($imageName, 'landing/')) {
                return asset('storage/' . $imageName);
            }
            
            return asset('images/' . $imageName);
        }
        
        return asset('images/no-image.png');
    }
    
    /**
     * Accessor para obtener la imagen por defecto si es null
     */
    public function getImagenAttribute($value)
    {
        // Si no hay valor, usar el mapeo del config
        if (!$value) {
            $map = config('productos_imagenes');
            if (is_array($map)) {
                $imageName = $map[$this->slug] ?? ($map['default'] ?? 'no-image.png');
                
                // Si la imagen del config empieza con landing/, asumir que está en storage
                if (Str::startsWith($imageName, 'landing/')) {
                    return 'storage/' . $imageName;
                }
                
                return $imageName;
            }
            return 'no-image.png';
        }
        
        return $value;
    }
}
