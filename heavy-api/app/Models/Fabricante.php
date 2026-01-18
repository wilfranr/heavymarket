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
