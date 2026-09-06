<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property int $orden_compra_id
 * @property string $ruta
 * @property string $nombre_original
 * @property string|null $mime
 * @property int|null $size
 * @property string $tipo
 * @property int|null $creado_por
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read OrdenCompra $ordenCompra
 * @property-read User|null $creadoPor
 * @property-read string $url
 */
class OrdenCompraDespachoArchivo extends Model
{
    use HasFactory;

    public const TIPO_FOTO_PAQUETE = 'foto_paquete';

    public const TIPO_GUIA = 'guia';

    protected $table = 'orden_compra_despacho_archivos';

    protected $fillable = [
        'orden_compra_id',
        'ruta',
        'nombre_original',
        'mime',
        'size',
        'tipo',
        'creado_por',
    ];

    protected $casts = [
        'size' => 'integer',
        'orden_compra_id' => 'integer',
        'creado_por' => 'integer',
    ];

    protected $appends = ['url'];

    public function ordenCompra(): BelongsTo
    {
        return $this->belongsTo(OrdenCompra::class, 'orden_compra_id');
    }

    public function creadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creado_por');
    }

    public function getUrlAttribute(): string
    {
        return Storage::disk('public')->url($this->ruta);
    }
}
