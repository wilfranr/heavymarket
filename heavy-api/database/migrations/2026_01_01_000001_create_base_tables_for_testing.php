<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Crea las tablas base necesarias para tests con SQLite in-memory.
     * Estas tablas vinieron de SQL Server, no existen en migraciones Laravel.
     */
    public function up(): void
    {
        // Tablas necesarias para tests - solo crear si no existen
        
        // 1. users
        if (!Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('email')->unique();
                $table->timestamp('email_verified_at')->nullable();
                $table->string('password');
                $table->rememberToken();
                $table->timestamps();
            });
        }

        // 2. terceros
        if (!Schema::hasTable('terceros')) {
            Schema::create('terceros', function (Blueprint $table) {
                $table->id();
                $table->string('tipo_documento', 20)->nullable();
                $table->string('documento', 50)->nullable();
                $table->string('razon_social', 255)->nullable();
                $table->string('nombre_comercial', 255)->nullable();
                $table->string('tipo_tercero', 20)->nullable();
                $table->string('email', 255)->nullable();
                $table->string('telefono', 50)->nullable();
                $table->string('celular', 50)->nullable();
                $table->string('direccion', 255)->nullable();
                $table->string('ciudad', 100)->nullable();
                $table->string('pais', 100)->nullable();
                $table->boolean('es_cliente')->default(true);
                $table->boolean('es_proveedor')->default(false);
                $table->string('estado', 20)->default('Activo');
                $table->timestamps();
            });
        }

        // 3. pedido_referencia (tabla pivot pedido-referencia)
        if (!Schema::hasTable('pedido_referencia')) {
            Schema::create('pedido_referencia', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('pedido_id')->nullable();
                $table->unsignedBigInteger('referencia_id')->nullable();
                $table->unsignedBigInteger('sistema_id')->nullable();
                $table->unsignedBigInteger('lista_id')->nullable();
                $table->unsignedBigInteger('marca_id')->nullable();
                $table->string('definicion', 255)->nullable();
                $table->integer('cantidad')->default(1);
                $table->text('comentario')->nullable();
                $table->string('imagen', 255)->nullable();
                $table->string('mostrar_referencia', 10)->nullable();
                $table->string('estado', 50)->nullable();
                $table->timestamps();
            });
        }

        // 4. pedido_referencia_proveedor
        if (!Schema::hasTable('pedido_referencia_proveedor')) {
            Schema::create('pedido_referencia_proveedor', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('pedido_referencia_id')->nullable();
                $table->unsignedBigInteger('referencia_id')->nullable();
                $table->unsignedBigInteger('proveedor_id')->nullable();
                $table->string('referencia_proveedor', 255)->nullable();
                $table->string('descripcion', 255)->nullable();
                $table->integer('cantidad')->default(1);
                $table->decimal('valor_unitario', 15, 2)->nullable();
                $table->decimal('valor_total', 15, 2)->nullable();
                $table->date('fecha_entrega')->nullable();
                $table->text('comentario')->nullable();
                $table->string('estado', 50)->nullable();
                $table->timestamps();
            });
        }

        // 5. referencias
        if (!Schema::hasTable('referencias')) {
            Schema::create('referencias', function (Blueprint $table) {
                $table->id();
                $table->string('referencia', 255)->unique();
                $table->unsignedBigInteger('articulo_id')->nullable();
                $table->unsignedBigInteger('marca_id')->nullable();
                $table->boolean('es_temporal')->default(false);
                $table->text('comentario')->nullable();
                $table->timestamps();
            });
        }

        // 6. maquinas
        if (!Schema::hasTable('maquinas')) {
            Schema::create('maquinas', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('tipo')->nullable();
                $table->string('modelo', 255)->nullable();
                $table->unsignedBigInteger('fabricante_id')->nullable();
                $table->string('serie', 255)->nullable();
                $table->string('arreglo', 255)->nullable();
                $table->string('foto', 255)->nullable();
                $table->string('fotoId', 255)->nullable();
                $table->enum('estado_revision', ['por_revisar', 'revisado'])->default('por_revisar');
                $table->timestamps();
            });
        }

        // 7. sistemas
        if (!Schema::hasTable('sistemas')) {
            Schema::create('sistemas', function (Blueprint $table) {
                $table->id();
                $table->string('nombre', 255);
                $table->string('descripcion', 500)->nullable();
                $table->timestamps();
            });
        }

        // 8. articulos
        if (!Schema::hasTable('articulos')) {
            Schema::create('articulos', function (Blueprint $table) {
                $table->id();
                $table->string('nombre', 255);
                $table->text('descripcion')->nullable();
                $table->unsignedBigInteger('categoria_id')->nullable();
                $table->string('referencia', 255)->nullable();
                $table->string('marca', 255)->nullable();
                $table->timestamps();
            });
        }

        // 9. categorias
        if (!Schema::hasTable('categorias')) {
            Schema::create('categorias', function (Blueprint $table) {
                $table->id();
                $table->string('nombre', 255);
                $table->string('slug', 255)->unique();
                $table->text('descripcion')->nullable();
                $table->timestamps();
            });
        }

        // 10. contactos (tercero_contacto)
        if (!Schema::hasTable('contactos')) {
            Schema::create('contactos', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('tercero_id')->nullable();
                $table->string('nombre', 255);
                $table->string('cargo', 100)->nullable();
                $table->string('telefono', 50)->nullable();
                $table->string('indicativo', 10)->nullable();
                $table->unsignedBigInteger('country_id')->nullable();
                $table->string('email', 255)->nullable();
                $table->boolean('principal')->default(false);
                $table->timestamps();
            });
        }

        // 11. pedidos
        if (!Schema::hasTable('pedidos')) {
            Schema::create('pedidos', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->unsignedBigInteger('tercero_id')->nullable();
                $table->string('direccion', 200)->nullable();
                $table->text('comentario')->nullable();
                $table->unsignedBigInteger('contacto_id')->nullable();
                $table->string('estado', 50)->default('Nuevo');
                $table->unsignedBigInteger('maquina_id')->nullable();
                $table->unsignedBigInteger('fabricante_id')->nullable();
                $table->string('motivo_rechazo', 255)->nullable();
                $table->text('comentarios_rechazo')->nullable();
                $table->timestamps();
            });
        }

        // 12. fabricantes (tabla legacy)
        if (!Schema::hasTable('fabricantes')) {
            Schema::create('fabricantes', function (Blueprint $table) {
                $table->id();
                $table->string('nombre', 255);
                $table->text('descripcion')->nullable();
                $table->string('logo', 255)->nullable();
                $table->timestamps();
            });
        }

        // 13. countries
        if (!Schema::hasTable('countries')) {
            Schema::create('countries', function (Blueprint $table) {
                $table->id();
                $table->string('name', 100);
                $table->string('codigo', 10)->nullable();
                $table->timestamps();
            });
        }

        // 14. role_has_permissions y relacionados (Spatie)
        if (!Schema::hasTable('permissions')) {
            Schema::create('permissions', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('guard_name');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('roles')) {
            Schema::create('roles', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('guard_name');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('model_has_permissions')) {
            Schema::create('model_has_permissions', function (Blueprint $table) {
                $table->unsignedBigInteger('permission_id');
                $table->string('model_type');
                $table->unsignedBigInteger('model_id');
                $table->primary(['permission_id', 'model_id', 'model_type']);
            });
        }

        if (!Schema::hasTable('model_has_roles')) {
            Schema::create('model_has_roles', function (Blueprint $table) {
                $table->unsignedBigInteger('role_id');
                $table->string('model_type');
                $table->unsignedBigInteger('model_id');
                $table->primary(['role_id', 'model_id', 'model_type']);
            });
        }

        if (!Schema::hasTable('role_has_permissions')) {
            Schema::create('role_has_permissions', function (Blueprint $table) {
                $table->unsignedBigInteger('permission_id');
                $table->unsignedBigInteger('role_id');
                $table->primary(['permission_id', 'role_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (app()->environment('testing')) {
            Schema::dropIfExists('role_has_permissions');
            Schema::dropIfExists('model_has_roles');
            Schema::dropIfExists('model_has_permissions');
            Schema::dropIfExists('roles');
            Schema::dropIfExists('permissions');
            Schema::dropIfExists('countries');
            Schema::dropIfExists('fabricantes');
            Schema::dropIfExists('pedidos');
            Schema::dropIfExists('contactos');
            Schema::dropIfExists('categorias');
            Schema::dropIfExists('articulos');
            Schema::dropIfExists('sistemas');
            Schema::dropIfExists('maquinas');
            Schema::dropIfExists('referencias');
            Schema::dropIfExists('pedido_referencia_proveedor');
            Schema::dropIfExists('pedido_referencia');
            Schema::dropIfExists('terceros');
            Schema::dropIfExists('users');
        }
    }
};
