<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TerceroFabricante extends Model
{
    use HasFactory;

    protected $table = 'tercero_fabricantes';

    protected $fillable = [
        'tercero_id',
        'lista_id',
    ];

    public function tercero(): BelongsTo
    {
        return $this->belongsTo(Tercero::class, 'tercero_id');
    }

    public function fabricante(): BelongsTo
    {
        return $this->belongsTo(Lista::class, 'lista_id')->where('tipo', 'Fabricantes');
    }
}
