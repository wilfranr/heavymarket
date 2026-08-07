<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $recepcion_compra_id
 * @property string $ruta
 * @property string $nombre_original
 * @property string $mime
 * @property int $size
 * @property string $tipo
 * @property int|null $creado_por
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read RecepcionCompra $recepcionCompra
 * @property-read User|null $creadoPor
 */
class RecepcionCompraImagen extends Model
{
    use HasFactory;

    public const TIPO_GUIA = 'guia';

    public const TIPO_FOTO = 'foto';

    protected $table = 'recepcion_compra_imagenes';

    protected $fillable = [
        'recepcion_compra_id',
        'ruta',
        'nombre_original',
        'mime',
        'size',
        'tipo',
        'creado_por',
    ];

    protected $casts = [
        'size' => 'integer',
    ];

    public function recepcionCompra(): BelongsTo
    {
        return $this->belongsTo(RecepcionCompra::class, 'recepcion_compra_id');
    }

    public function creadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creado_por');
    }
}
