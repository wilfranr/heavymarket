<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TerceroSistema extends Model
{
    use HasFactory;

    protected $table = 'tercero_sistemas';

    protected $fillable = [
        'tercero_id',
        'sistema_id',
    ];

    public function tercero(): BelongsTo
    {
        return $this->belongsTo(Tercero::class, 'tercero_id');
    }

    public function sistema(): BelongsTo
    {
        return $this->belongsTo(Sistema::class, 'sistema_id');
    }
}