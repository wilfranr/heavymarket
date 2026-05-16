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
        if (! Schema::hasTable('users')) {
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
        if (! Schema::hasTable('terceros')) {
            Schema::create('terceros', function (Blueprint $table) {
                $table->id();
                $table->string('tipo_documento', 20)->nullable();
                $table->string('numero_documento', 50)->nullable();
                $table->string('nombre', 255)->nullable();
                $table->string('nombre_comercial', 255)->nullable();
                $table->string('tipo', 30)->nullable();
                $table->string('email', 255)->nullable();
                $table->string('telefono', 50)->nullable();
                $table->string('celular', 50)->nullable();
                $table->string('direccion', 255)->nullable();
                $table->string('ciudad', 100)->nullable();
                $table->string('pais', 100)->nullable();
                $table->boolean('es_cliente')->default(true);
                $table->boolean('es_proveedor')->default(false);
                $table->string('estado', 20)->default('Activo');
                $table->string('forma_pago', 50)->nullable();
                $table->string('email_factura_electronica', 255)->nullable();
                $table->string('dv', 1)->nullable();
                $table->string('rut', 255)->nullable();
                $table->string('certificacion_bancaria', 255)->nullable();
                $table->string('camara_comercio', 255)->nullable();
                $table->string('cedula_representante_legal', 255)->nullable();
                $table->string('sitio_web', 255)->nullable();
                $table->integer('puntos')->default(0);
                $table->timestamps();
            });
        }

        // 3. pedido_referencia (tabla pivot pedido-referencia)
        if (! Schema::hasTable('pedido_referencia')) {
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
        if (! Schema::hasTable('pedido_referencia_proveedor')) {
            Schema::create('pedido_referencia_proveedor', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('pedido_referencia_id')->nullable();
                $table->unsignedBigInteger('referencia_id')->nullable();
                $table->unsignedBigInteger('proveedor_id')->nullable();
                $table->unsignedBigInteger('marca_id')->nullable();
                $table->string('referencia_proveedor', 255)->nullable();
                $table->string('descripcion', 255)->nullable();
                $table->integer('cantidad')->default(1);
                $table->integer('dias_entrega')->nullable();
                $table->decimal('costo_unidad', 15, 2)->nullable();
                $table->decimal('utilidad', 15, 2)->nullable();
                $table->decimal('valor_unitario', 15, 2)->nullable();
                $table->decimal('valor_total', 15, 2)->nullable();
                $table->string('ubicacion', 255)->nullable();
                $table->date('fecha_entrega')->nullable();
                $table->text('comentario')->nullable();
                $table->string('estado', 50)->nullable();
                $table->timestamps();
            });
        }

        // 5. referencias
        if (! Schema::hasTable('referencias')) {
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
        if (! Schema::hasTable('maquinas')) {
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
        if (! Schema::hasTable('sistemas')) {
            Schema::create('sistemas', function (Blueprint $table) {
                $table->id();
                $table->string('nombre', 255);
                $table->string('descripcion', 500)->nullable();
                $table->string('imagen', 255)->nullable();
                $table->timestamps();
            });
        }

        // 7.1 sistema_lista (tabla pivot sistema-lista)
        if (! Schema::hasTable('sistema_lista')) {
            Schema::create('sistema_lista', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('sistema_id');
                $table->unsignedBigInteger('lista_id');
                $table->timestamps();

                $table->foreign('sistema_id')->references('id')->on('sistemas')->onDelete('cascade');
                $table->foreign('lista_id')->references('id')->on('listas')->onDelete('cascade');
            });
        }

        // 8. articulos
        if (! Schema::hasTable('articulos')) {
            Schema::create('articulos', function (Blueprint $table) {
                $table->id();
                $table->string('definicion', 255);
                $table->text('descripcionEspecifica')->nullable();
                $table->text('comentarios')->nullable();
                $table->decimal('peso', 15, 2)->nullable();
                $table->string('fotoDescriptiva', 255)->nullable();
                $table->string('foto_medida', 255)->nullable();
                $table->timestamps();
            });
        }

        // 9. categorias
        if (! Schema::hasTable('categorias')) {
            Schema::create('categorias', function (Blueprint $table) {
                $table->id();
                $table->string('nombre', 255);
                $table->string('slug', 255)->unique();
                $table->text('descripcion')->nullable();
                $table->timestamps();
            });
        }

        // 10. contactos (tercero_contacto)
        if (! Schema::hasTable('contactos')) {
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
        if (! Schema::hasTable('pedidos')) {
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

        // 11b. pedido_articulos (requerido por withCount en PedidoController::index en tests SQLite)
        if (! Schema::hasTable('pedido_articulos')) {
            Schema::create('pedido_articulos', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('pedido_id')->nullable();
                $table->unsignedBigInteger('articulo_id')->nullable();
                $table->unsignedInteger('cantidad')->default(1);
                $table->text('comentario')->nullable();
                $table->unsignedBigInteger('sistema_id')->nullable();
                $table->string('imagen', 255)->nullable();
                $table->timestamps();
            });
        }

        // 11c. cotizaciones
        if (! Schema::hasTable('cotizaciones')) {
            Schema::create('cotizaciones', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->unsignedBigInteger('tercero_id')->nullable();
                $table->unsignedBigInteger('pedido_id')->nullable();
                $table->string('estado', 50)->default('Borrador');
                $table->decimal('valor_total', 15, 2)->default(0);
                $table->text('observaciones')->nullable();
                $table->timestamps();
            });
        }

        // 11d. cotizacion_referencias
        if (! Schema::hasTable('cotizacion_referencias')) {
            Schema::create('cotizacion_referencias', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('cotizacion_id');
                $table->unsignedBigInteger('referencia_id');
                $table->integer('cantidad')->default(1);
                $table->decimal('valor_unitario', 15, 2)->default(0);
                $table->decimal('valor_total', 15, 2)->default(0);
                $table->timestamps();
            });
        }

        // 11e. orden_compras
        if (! Schema::hasTable('orden_compras')) {
            Schema::create('orden_compras', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->unsignedBigInteger('tercero_id')->nullable();
                $table->unsignedBigInteger('pedido_id')->nullable();
                $table->unsignedBigInteger('cotizacion_id')->nullable();
                $table->unsignedBigInteger('proveedor_id');
                $table->string('estado', 50)->default('Pendiente');
                $table->date('fecha_expedicion')->nullable();
                $table->date('fecha_entrega')->nullable();
                $table->text('observaciones')->nullable();
                $table->decimal('valor_total', 15, 2)->default(0);
                $table->string('direccion', 255)->nullable();
                $table->string('telefono', 50)->nullable();
                $table->string('guia', 100)->nullable();
                $table->string('color', 20)->default('#FFFF00');
                $table->timestamps();
            });
        }

        // 11f. orden_compra_referencia (pivot)
        if (! Schema::hasTable('orden_compra_referencia')) {
            Schema::create('orden_compra_referencia', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('orden_compra_id');
                $table->unsignedBigInteger('referencia_id');
                $table->integer('cantidad')->default(1);
                $table->decimal('valor_unitario', 15, 2)->default(0);
                $table->decimal('valor_total', 15, 2)->default(0);
                $table->timestamps();
            });
        }

        // 12. fabricantes (tabla legacy)
        if (! Schema::hasTable('fabricantes')) {
            Schema::create('fabricantes', function (Blueprint $table) {
                $table->id();
                $table->string('nombre', 255);
                $table->text('descripcion')->nullable();
                $table->string('logo', 255)->nullable();
                $table->timestamps();
            });
        }

        // 13. countries
        if (! Schema::hasTable('countries')) {
            Schema::create('countries', function (Blueprint $table) {
                $table->id();
                $table->string('name', 100);
                $table->string('iso2', 10)->nullable();
                $table->string('codigo', 10)->nullable();
                $table->string('phonecode', 20)->nullable();
                $table->boolean('is_active')->default(true);
                $table->softDeletes();
                $table->timestamps();
            });
        }

        // 13.1 empresas
        if (! Schema::hasTable('empresas')) {
            Schema::create('empresas', function (Blueprint $table) {
                $table->id();
                $table->string('nombre');
                $table->string('siglas')->nullable();
                $table->string('nit')->nullable();
                $table->string('email')->nullable();
                $table->string('celular')->nullable();
                $table->string('telefono')->nullable();
                $table->string('direccion')->nullable();
                $table->string('representante')->nullable();
                $table->string('logo_light')->nullable();
                $table->string('logo_dark')->nullable();
                $table->boolean('estado')->default(true);
                $table->decimal('trm', 15, 2)->default(0);
                $table->decimal('flete', 15, 2)->default(0);
                $table->softDeletes();
                $table->timestamps();
            });
        }

        // 13.2 states
        if (! Schema::hasTable('states')) {
            Schema::create('states', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->unsignedBigInteger('country_id');
                $table->boolean('is_active')->default(true);
                $table->softDeletes();
                $table->timestamps();

                $table->foreign('country_id')->references('id')->on('countries');
            });
        }

        // 13.3 cities
        if (! Schema::hasTable('cities')) {
            Schema::create('cities', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->unsignedBigInteger('country_id');
                $table->unsignedBigInteger('state_id');
                $table->boolean('is_active')->default(true);
                $table->softDeletes();
                $table->timestamps();

                $table->foreign('country_id')->references('id')->on('countries');
                $table->foreign('state_id')->references('id')->on('states');
            });
        }

        // 14. role_has_permissions y relacionados (Spatie)
        if (! Schema::hasTable('permissions')) {
            Schema::create('permissions', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('guard_name');
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('roles')) {
            Schema::create('roles', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('guard_name');
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('model_has_permissions')) {
            Schema::create('model_has_permissions', function (Blueprint $table) {
                $table->unsignedBigInteger('permission_id');
                $table->string('model_type');
                $table->unsignedBigInteger('model_id');
                $table->primary(['permission_id', 'model_id', 'model_type']);
            });
        }

        if (! Schema::hasTable('model_has_roles')) {
            Schema::create('model_has_roles', function (Blueprint $table) {
                $table->unsignedBigInteger('role_id');
                $table->string('model_type');
                $table->unsignedBigInteger('model_id');
                $table->primary(['role_id', 'model_id', 'model_type']);
            });
        }

        if (! Schema::hasTable('role_has_permissions')) {
            Schema::create('role_has_permissions', function (Blueprint $table) {
                $table->unsignedBigInteger('permission_id');
                $table->unsignedBigInteger('role_id');
                $table->primary(['permission_id', 'role_id']);
            });
        }

        // 15. articulos_referencias (pivot)
        if (! Schema::hasTable('articulos_referencias')) {
            Schema::create('articulos_referencias', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('articulo_id');
                $table->unsignedBigInteger('referencia_id');
                $table->timestamps();
            });
        }

        // 16. articulo_juegos
        if (! Schema::hasTable('articulo_juegos')) {
            Schema::create('articulo_juegos', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('articulo_id');
                $table->unsignedBigInteger('referencia_id');
                $table->integer('cantidad')->default(1);
                $table->text('comentario')->nullable();
                $table->timestamps();
            });
        }

        // 17. medidas
        if (! Schema::hasTable('medidas')) {
            Schema::create('medidas', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('articulo_id');
                $table->string('identificador')->nullable();
                $table->string('nombre')->nullable();
                $table->string('valor')->nullable();
                $table->string('unidad')->nullable();
                $table->string('tipo')->nullable();
                $table->string('imagen', 255)->nullable();
                $table->timestamps();
            });
        }

        // 18. transportadoras
        if (! Schema::hasTable('transportadoras')) {
            Schema::create('transportadoras', function (Blueprint $table) {
                $table->id();
                $table->string('nombre', 255);
                $table->string('nit', 50)->nullable();
                $table->string('telefono', 50)->nullable();
                $table->string('email', 100)->nullable();
                $table->string('direccion', 255)->nullable();
                $table->string('estado', 20)->default('Activo');
                $table->timestamps();
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
            Schema::dropIfExists('pedido_articulos');
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
