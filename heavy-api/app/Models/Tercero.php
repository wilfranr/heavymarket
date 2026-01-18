<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\City;
use App\Models\Country;
use App\Models\State;
use App\Models\Maquina;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Modelo Tercero - Gestiona proveedores, clientes y terceros del sistema CYH
 * 
 * Este modelo representa a todos los terceros que interactúan con el sistema,
 * incluyendo proveedores, clientes, fabricantes y otros socios comerciales.
 * Es fundamental para la gestión de relaciones comerciales y transacciones.
 * 
 * @property int $id Identificador único del tercero
 * @property string $nombre Nombre o razón social del tercero
 * @property string $tipo_documento Tipo de documento de identificación
 * @property string $numero_documento Número del documento de identificación
 * @property string $direccion Dirección física del tercero
 * @property string $telefono Número de teléfono de contacto
 * @property string $email Dirección de correo electrónico
 * @property string|null $dv Dígito de verificación (Colombia)
 * @property string $estado Estado activo/inactivo del tercero
 * @property string $forma_pago Forma de pago preferida
 * @property string|null $email_factura_electronica Email para facturación electrónica
 * @property string|null $rut Registro Único Tributario (Chile)
 * @property string|null $certificacion_bancaria Certificación bancaria del tercero
 * @property string|null $camara_comercio Registro de cámara de comercio
 * @property string|null $cedula_representante_legal Cédula del representante legal
 * @property string|null $sitio_web Sitio web del tercero
 * @property int $puntos Puntos o crédito del tercero
 * @property string $tipo Tipo de tercero (proveedor, cliente, ambos)
 * @property int $country_id ID del país del tercero
 * @property int $state_id ID del estado/provincia del tercero
 * @property int $city_id ID de la ciudad del tercero
 * @property \Carbon\Carbon $created_at Fecha de creación del tercero
 * @property \Carbon\Carbon $updated_at Fecha de última actualización
 * 
 * @property-read Country $country País del tercero
 * @property-read State $state Estado/provincia del tercero
 * @property-read City $city Ciudad del tercero
 * @property-read \Illuminate\Database\Eloquent\Collection|Maquina[] $maquinas Máquinas asociadas al tercero
 * @property-read \Illuminate\Database\Eloquent\Collection|Contacto[] $contactos Contactos del tercero
 * @property-read \Illuminate\Database\Eloquent\Collection|Direccion[] $direcciones Direcciones adicionales
 * @property-read \Illuminate\Database\Eloquent\Collection|Pedido[] $pedidos Pedidos asociados al tercero
 * @property-read \Illuminate\Database\Eloquent\Collection|Sistema[] $sistemas Sistemas asociados al tercero
 * @property-read \Illuminate\Database\Eloquent\Collection|Fabricante[] $fabricantes Fabricantes asociados
 * @property-read \Illuminate\Database\Eloquent\Collection|Categoria[] $categorias Categorías del tercero
 * 
 * @since 1.0.0
 * @author Sistema CYH
 */
class Tercero extends Model
{
    /**
     * Los atributos que son asignables masivamente.
     * 
     * @var array<string>
     */
    protected $fillable = [
        'nombre',                      // Nombre o razón social del tercero
        'tipo_documento',             // Tipo de documento de identificación
        'numero_documento',           // Número del documento de identificación
        'direccion',                  // Dirección física del tercero
        'telefono',                   // Número de teléfono de contacto
        'email',                      // Dirección de correo electrónico
        'dv',                         // Dígito de verificación (Colombia)
        'estado',                     // Estado activo/inactivo del tercero
        'forma_pago',                 // Forma de pago preferida
        'email_factura_electronica',  // Email para facturación electrónica
        'rut',                        // Registro Único Tributario (Chile)
        'certificacion_bancaria',     // Certificación bancaria del tercero
        'camara_comercio',            // Registro de cámara de comercio
        'cedula_representante_legal', // Cédula del representante legal
        'sitio_web',                  // Sitio web del tercero
        'puntos',                     // Puntos o crédito del tercero
        'tipo',                       // Tipo de tercero (proveedor, cliente, ambos)
        'country_id',                 // ID del país del tercero
        'state_id',                   // ID del estado/provincia del tercero
        'city_id',                    // ID de la ciudad del tercero
    ];

    /**
     * Relación con el país del tercero.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function country()
    {
        return $this->belongsTo(Country::class);
    }

    /**
     * Relación con la ciudad del tercero.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function city()
    {
        return $this->belongsTo(City::class);
    }

    /**
     * Relación con el estado/provincia del tercero.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function states()
    {
        return $this->belongsTo(State::class);
    }

    /**
     * Relación muchos a muchos con máquinas.
     * Un tercero puede estar asociado a múltiples máquinas.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function maquinas()
    {
        return $this->belongsToMany(Maquina::class, 'tercero_maquina', 'tercero_id', 'maquina_id');
    }

    /**
     * Relación con los contactos del tercero.
     * Un tercero puede tener múltiples contactos.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function contactos()
    {
        return $this->hasMany(Contacto::class, 'tercero_id');
    }

    /**
     * Relación con las direcciones del tercero.
     * Un tercero puede tener múltiples direcciones.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function direcciones()
    {
        return $this->hasMany(Direccion::class, 'tercero_id');
    }

    /**
     * Relación con los pedidos del tercero.
     * Un tercero puede tener múltiples pedidos.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function pedidos()
    {
        return $this->hasMany(Pedido::class);
    }

    /**
     * Relación muchos a muchos con sistemas.
     * Un tercero puede estar asociado a múltiples sistemas.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function sistemas(): BelongsToMany
    {
        return $this->belongsToMany(Sistema::class, 'tercero_sistemas', 'tercero_id', 'sistema_id');
    }

    /**
     * Relación muchos a muchos con fabricantes.
     * Un tercero puede estar asociado a múltiples fabricantes.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function fabricantes(): BelongsToMany
    {
        return $this->belongsToMany(Fabricante::class, 'tercero_fabricantes', 'tercero_id', 'fabricante_id');
    }

    /**
     * Relación muchos a muchos con categorías.
     * Un tercero puede estar asociado a múltiples categorías.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function categorias()
    {
        return $this->belongsToMany(Categoria::class);
    }

    /**
     * Relación con las referencias de proveedor del tercero.
     * Un tercero puede tener múltiples referencias de proveedor.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function pedidosReferenciaProveedor()
    {
        return $this->hasMany(\App\Models\PedidoReferenciaProveedor::class, 'tercero_id');
    }
}
