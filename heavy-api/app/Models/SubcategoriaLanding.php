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
        $imagenValue = $this->getRawOriginal('imagen');
        
        // Si hay imagen guardada en BD (archivo subido en storage)
        if ($imagenValue && (\Illuminate\Support\Str::startsWith($imagenValue, 'images/') || \Illuminate\Support\Str::startsWith($imagenValue, 'landing/'))) {
            // Es una imagen subida, usar storage
            return \Illuminate\Support\Facades\Storage::disk('public')->url($imagenValue);
        }
        
        // Si hay imagen en BD pero es solo nombre de archivo (legacy o del seeder)
        if ($imagenValue) {
            // Usar directamente desde public/images
            return asset('images/' . $imagenValue);
        }
        
        // Fallback al mapeo del config
        $map = config('productos_imagenes');
        $imageName = $map[$this->slug] ?? $map['default'];
        return asset('images/' . $imageName);
    }
    
    /**
     * Helper para obtener el nombre del archivo de imagen
     */
    public function getImagenAttribute($value)
    {
        // Si no hay valor, usar el mapeo del config
        if (!$value) {
            $map = config('productos_imagenes');
            return $map[$this->slug] ?? $map['default'];
        }
        
        return $value;
    }
}
