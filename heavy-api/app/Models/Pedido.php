<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modelo Pedido - Gestiona los pedidos principales del sistema CYH
 * 
 * Este modelo representa un pedido completo en el sistema, incluyendo
 * información del cliente, referencias solicitadas, artículos y
 * proveedores asociados. Es el núcleo del flujo de trabajo de
 * cotización y compra.
 * 
 * @property int $id Identificador único del pedido
 * @property int $user_id ID del usuario que creó el pedido
 * @property int $tercero_id ID del tercero (cliente/proveedor)
 * @property string $direccion Dirección de entrega del pedido
 * @property string|null $comentario Comentarios adicionales del pedido
 * @property int|null $contacto_id ID del contacto asociado
 * @property int|null $maquina_id ID de la máquina asociada
 * @property int|null $fabricante_id ID del fabricante
 * @property string $estado Estado actual del pedido
 * @property string|null $motivo_rechazo Motivo si el pedido fue rechazado
 * @property \Carbon\Carbon $created_at Fecha de creación del pedido
 * @property \Carbon\Carbon $updated_at Fecha de última actualización
 * 
 * @property-read User $user Usuario que creó el pedido
 * @property-read Tercero $tercero Tercero asociado al pedido
 * @property-read Maquina|null $maquina Máquina asociada al pedido
 * @property-read Fabricante|null $fabricante Fabricante del pedido
 * @property-read Contacto|null $contacto Contacto asociado al pedido
 * @property-read \Illuminate\Database\Eloquent\Collection|PedidoReferencia[] $referencias Referencias del pedido
 * @property-read \Illuminate\Database\Eloquent\Collection|PedidoArticulo[] $articulos Artículos del pedido
 * @property-read \Illuminate\Database\Eloquent\Collection|PedidoReferenciaProveedor[] $referenciasProveedor Referencias con proveedores
 * 
 * @since 1.0.0
 * @author Sistema CYH
 */
class Pedido extends Model
{
    use HasFactory;

    protected $table = 'pedidos';

    /**
     * Los atributos que son asignables masivamente.
     * 
     * @var array<string>
     */
    protected $fillable = [
        'user_id',           // ID del usuario que creó el pedido
        'tercero_id',        // ID del tercero (cliente/proveedor)
        'direccion',         // Dirección de entrega del pedido
        'comentario',        // Comentarios adicionales del pedido
        'contacto_id',       // ID del contacto asociado
        'maquina_id',        // ID de la máquina asociada
        'fabricante_id',     // ID del fabricante
        'estado',            // Estado actual del pedido
        'motivo_rechazo',    // Motivo si el pedido fue rechazado
    ];

    /**
     * Relación con el usuario que creó el pedido.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relación con el tercero (cliente/proveedor) del pedido.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function tercero(): BelongsTo
    {
        return $this->belongsTo(Tercero::class);
    }

    /**
     * Relación con la máquina asociada al pedido.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function maquina()
    {
        return $this->belongsTo(Maquina::class);
    }

    /**
     * Relación con las referencias del pedido.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function referencias()
    {
        return $this->hasMany(PedidoReferencia::class);
    }

    /**
     * Relación con los artículos del pedido.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function articulos(): HasMany
    {
        return $this->hasMany(PedidoArticulo::class);
    }

    /**
     * Relación con las referencias y proveedores del pedido.
     * 
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function referenciasProveedor(): HasMany
    {
        return $this->hasMany(PedidoReferenciaProveedor::class);
    }




}

