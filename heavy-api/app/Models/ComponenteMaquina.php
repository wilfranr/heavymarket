<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ComponenteMaquina extends Model
{
    use HasFactory;

    protected $table = 'componentes_maquina';

    protected $fillable = [
        'maquina_id',
        'sistema_id',
        'marca_id',
        'modelo',
        'serie',
        'comentario',
        'foto_placa',
    ];

    public function maquina(): BelongsTo
    {
        return $this->belongsTo(Maquina::class);
    }

    public function sistema(): BelongsTo
    {
        return $this->belongsTo(Sistema::class, 'sistema_id');
    }

    public function marca(): BelongsTo
    {
        return $this->belongsTo(Lista::class, 'marca_id');
    }
}
