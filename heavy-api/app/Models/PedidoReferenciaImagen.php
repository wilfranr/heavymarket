<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PedidoReferenciaImagen extends Model
{
    protected $table = 'pedido_referencia_imagen';

    protected $fillable = [
        'pedido_referencia_id',
        'imagen',
        'origen',
    ];

    public const ORIGEN_CLIENTE = 'cliente';
    public const ORIGEN_ASESOR = 'asesor';
    public const ORIGEN_COSTEO = 'costeo';

    public function pedidoReferencia(): BelongsTo
    {
        return $this->belongsTo(PedidoReferencia::class, 'pedido_referencia_id');
    }

    /**
     * URL completa para mostrar la imagen (path de storage o URL externa).
     */
    public function getImagenUrlAttribute(): string
    {
        $imagen = $this->imagen;
        if (!$imagen) {
            return '';
        }
        if (str_starts_with($imagen, 'http')) {
            return $imagen;
        }
        return asset('storage/' . ltrim($imagen, '/'));
    }
}
