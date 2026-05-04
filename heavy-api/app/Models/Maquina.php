<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Maquina extends Model
{
    use \App\Traits\NormalizesResources, HasFactory;

    protected $fillable = [
        'tipo', // 'tipo' is a foreign key to the 'listas' table
        'modelo',
        'fabricante_id',
        'serie',
        'arreglo',
        'foto',
        'fotoId',
        'estado_revision',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'tipo' => 'integer',
        'fabricante_id' => 'integer',
    ];

    public function componentes()
    {
        return $this->hasMany(ComponenteMaquina::class);
    }

    /**
     * Attributes to be automatically normalized.
     */
    protected $normalizableAttributes = [
        'modelo' => 'title',
        'serie' => 'code',
        'arreglo' => 'sentence',
    ];

    public function terceros(): BelongsToMany
    {
        // Reference to the terceros table
        return $this->belongsToMany(Tercero::class, 'tercero_maquina', 'maquina_id', 'tercero_id');
    }

    // función para traer los datos concatenados de la maquina

    public function getMaquinaAttribute()
    {
        return "{$this->tipo} {$this->modelo} {$this->marca} {$this->serie} {$this->arreglo}";
    }

    /**
     * Accessor para obtener el nombre completo de la máquina
     */
    public function getNombreAttribute()
    {
        $parts = array_filter([
            $this->tipo,
            $this->modelo,
            $this->serie,
            $this->arreglo,
        ]);

        return implode(' ', $parts);
    }

    public function pedidos()
    {
        return $this->hasMany(Pedido::class);
    }

    public function fabricante(): BelongsTo
    {
        return $this->belongsTo(Lista::class, 'fabricante_id')->where('tipo', 'Fabricantes');
    }

    // relación con listas para traer lo tipos de maquina
    public function listas(): BelongsTo
    {
        // Reference to the listas table
        return $this->belongsTo(Lista::class, 'tipo')->where('tipo', 'Tipo de Máquina');
    }

    // relación con pedidos para traer las referencias vendidas
    public function referenciasVendidas()
    {
        return $this->hasManyThrough(
            \App\Models\PedidoReferencia::class, // Modelo final
            \App\Models\Pedido::class,           // Modelo intermedio
            'maquina_id',                        // Foreign key en Pedido que apunta a Maquina
            'pedido_id',                         // Foreign key en PedidoReferencia que apunta a Pedido
            'id',                                // Local key en Maquina
            'id'                                 // Local key en Pedido
        );
    }

    /**
     * Accessors para las imágenes principales de la máquina
     */
    public function getImagenUrlAttribute()
    {
        return $this->foto ? \Illuminate\Support\Facades\Storage::disk('public')->url($this->foto) : null;
    }

    public function getImagenPlacaUrlAttribute()
    {
        return $this->fotoId ? \Illuminate\Support\Facades\Storage::disk('public')->url($this->fotoId) : null;
    }

    /**
     * Accessors para obtener datos del motor de forma aplanada
     */
    public function getMarcaMotorAttribute()
    {
        return $this->componentes->where('sistema_id', 42)->first()?->marca?->nombre;
    }

    public function getModeloMotorAttribute()
    {
        return $this->componentes->where('sistema_id', 42)->first()?->modelo;
    }

    public function getSerieMotorAttribute()
    {
        return $this->componentes->where('sistema_id', 42)->first()?->serie;
    }

    public function getComentarioMotorAttribute()
    {
        return $this->componentes->where('sistema_id', 42)->first()?->comentario;
    }

    public function getImagenMotorUrlAttribute()
    {
        $foto = $this->componentes->where('sistema_id', 42)->first()?->foto_placa;
        return $foto ? \Illuminate\Support\Facades\Storage::disk('public')->url($foto) : null;
    }

    /**
     * Accessors para obtener datos de la transmisión de forma aplanada
     */
    public function getMarcaTransmisionAttribute()
    {
        return $this->componentes->where('sistema_id', 49)->first()?->marca?->nombre;
    }

    public function getModeloTransmisionAttribute()
    {
        return $this->componentes->where('sistema_id', 49)->first()?->modelo;
    }

    public function getSerieTransmisionAttribute()
    {
        return $this->componentes->where('sistema_id', 49)->first()?->serie;
    }

    public function getComentarioTransmisionAttribute()
    {
        return $this->componentes->where('sistema_id', 49)->first()?->comentario;
    }

    public function getImagenTransmisionUrlAttribute()
    {
        $foto = $this->componentes->where('sistema_id', 49)->first()?->foto_placa;
        return $foto ? \Illuminate\Support\Facades\Storage::disk('public')->url($foto) : null;
    }
}
