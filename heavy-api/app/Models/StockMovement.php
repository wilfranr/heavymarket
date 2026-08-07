<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $referencia_id
 * @property int $cantidad
 * @property string $tipo_movimiento
 * @property string $origen_type
 * @property int $origen_id
 * @property int|null $usuario_id
 * @property string|null $observaciones
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Referencia $referencia
 * @property-read Model $origen
 * @property-read User|null $usuario
 */
class StockMovement extends Model
{
    use HasFactory;

    public const ENTRADA = 'entrada';

    public const SALIDA = 'salida';

    public const AJUSTE = 'ajuste';

    protected $table = 'stock_movements';

    protected $fillable = [
        'referencia_id',
        'cantidad',
        'tipo_movimiento',
        'origen_type',
        'origen_id',
        'usuario_id',
        'observaciones',
    ];

    protected $casts = [
        'cantidad' => 'integer',
    ];

    public function referencia(): BelongsTo
    {
        return $this->belongsTo(Referencia::class, 'referencia_id');
    }

    public function origen(): MorphTo
    {
        return $this->morphTo();
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }
}
