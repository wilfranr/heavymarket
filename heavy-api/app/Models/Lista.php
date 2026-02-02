<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lista extends Model
{
    use HasFactory, SoftDeletes, \App\Traits\NormalizesResources;

    protected $fillable = [
        'tipo',
        'nombre',
        'definicion',
        'foto',
        'fotoMedida',
        'sistema_id',
        'parent_id',
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
    
    public function getNombreAttribute($value): string
    {
        return ucfirst($value); // Asegura que siempre tenga la primera letra en mayúscula
    }
}