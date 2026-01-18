<?php

declare(strict_types=1);

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

/**
 * Modelo User - Gestiona los usuarios del sistema HeavyMarket
 * 
 * Este modelo representa a los usuarios que pueden acceder al sistema,
 * implementando autenticación API con Sanctum y autorización con roles
 * y permisos de Spatie Permission.
 * 
 * @property int $id Identificador único del usuario
 * @property string $name Nombre completo del usuario
 * @property string $email Dirección de correo electrónico (única)
 * @property string $password Contraseña hasheada del usuario
 * @property string|null $email_verified_at Fecha de verificación del email
 * @property string|null $remember_token Token para "recordar sesión"
 * @property \Carbon\Carbon $created_at Fecha de creación del usuario
 * @property \Carbon\Carbon $updated_at Fecha de última actualización
 * 
 * @property-read \Illuminate\Database\Eloquent\Collection|\Spatie\Permission\Models\Role[] $roles Roles asignados al usuario
 * @property-read \Illuminate\Database\Eloquent\Collection|\Spatie\Permission\Models\Permission[] $permissions Permisos directos del usuario
 * 
 * @since 1.0.0
 * @author Sistema HeavyMarket
 */
class User extends Authenticatable
{
    /**
     * Traits utilizados por el modelo User
     * 
     * @uses \Laravel\Sanctum\HasApiTokens Para autenticación API con tokens
     * @uses \Illuminate\Database\Eloquent\Factories\HasFactory Para factories de testing
     * @uses \Illuminate\Notifications\Notifiable Para sistema de notificaciones
     * @uses \Spatie\Permission\Traits\HasRoles Para gestión de roles y permisos
     */
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    /**
     * Los atributos que son asignables masivamente.
     * 
     * @var array<int, string>
     */
    protected $fillable = [
        'name',      // Nombre completo del usuario
        'email',     // Dirección de correo electrónico
        'password',  // Contraseña del usuario
    ];

    /**
     * Los atributos que deben ocultarse durante la serialización.
     * 
     * @var array<int, string>
     */
    protected $hidden = [
        'password',        // Contraseña hasheada (nunca se expone)
        'remember_token',  // Token de "recordar sesión" (seguridad)
    ];

    /**
     * Los atributos que deben ser convertidos a tipos nativos.
     * 
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',  // Convierte a instancia de Carbon
        'password' => 'hashed',             // Aplica hash automáticamente
    ];

    /**
     * Verifica si el usuario tiene uno de los roles permitidos
     *
     * @param string|array $roles
     * @return bool
     */
    public function isAuthorized(string|array $roles): bool
    {
        return $this->hasAnyRole(is_array($roles) ? $roles : [$roles]);
    }
}
