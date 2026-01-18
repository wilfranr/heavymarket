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

    public function terceros(): BelongsToMany
    {
        return $this->belongsToMany(Tercero::class, 'tercero_sistemas', 'sistema_id', 'tercero_id');
    }
    
    public function listas(): BelongsToMany
    {
        return $this->belongsToMany(Lista::class, 'sistema_lista', 'sistema_id', 'lista_id');
    }
}