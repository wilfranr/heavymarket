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
        'fabricante_id',
    ];

    public function tercero(): BelongsTo
    {
        return $this->belongsTo(Tercero::class, 'tercero_id');
    }

    public function fabricante(): BelongsTo
    {
        return $this->belongsTo(Fabricante::class, 'fabricante_id');
    }
}
