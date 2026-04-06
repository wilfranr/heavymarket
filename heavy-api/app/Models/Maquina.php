<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Maquina extends Model
{
    use HasFactory, \App\Traits\NormalizesResources;

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

    //función para traer los datos concatenados de la maquina

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
            $this->arreglo
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



    //relación con listas para traer lo tipos de maquina
    public function listas(): BelongsTo
    {
        // Reference to the listas table
        return $this->belongsTo(Lista::class, 'tipo')->where('tipo', "Tipo de Máquina");
    }
    
    //relación con pedidos para traer las referencias vendidas
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
}