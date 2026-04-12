<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tablas requeridas por Sanctum y relaciones de Tercero usadas en la API (tests SQLite / entornos mínimos).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('personal_access_tokens')) {
            Schema::create('personal_access_tokens', function (Blueprint $table) {
                $table->id();
                $table->morphs('tokenable');
                $table->text('name');
                $table->string('token', 64)->unique();
                $table->text('abilities')->nullable();
                $table->timestamp('last_used_at')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('direcciones')) {
            Schema::create('direcciones', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tercero_id')->constrained('terceros')->cascadeOnDelete();
                $table->string('direccion')->nullable();
                $table->unsignedBigInteger('city_id')->nullable();
                $table->unsignedBigInteger('state_id')->nullable();
                $table->unsignedBigInteger('country_id')->nullable();
                $table->boolean('principal')->default(false);
                $table->string('destinatario')->nullable();
                $table->string('nit_cc')->nullable();
                $table->unsignedBigInteger('transportadora_id')->nullable();
                $table->string('forma_pago')->nullable();
                $table->string('telefono')->nullable();
                $table->string('ciudad_texto')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('tercero_maquina')) {
            Schema::create('tercero_maquina', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tercero_id')->constrained('terceros')->cascadeOnDelete();
                $table->foreignId('maquina_id')->constrained('maquinas')->cascadeOnDelete();
                $table->unique(['tercero_id', 'maquina_id']);
            });
        }

        if (! Schema::hasTable('tercero_sistemas')) {
            Schema::create('tercero_sistemas', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tercero_id')->constrained('terceros')->cascadeOnDelete();
                $table->foreignId('sistema_id')->constrained('sistemas')->cascadeOnDelete();
                $table->unique(['tercero_id', 'sistema_id']);
            });
        }

        if (! Schema::hasTable('tercero_fabricantes')) {
            Schema::create('tercero_fabricantes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tercero_id')->constrained('terceros')->cascadeOnDelete();
                $table->foreignId('lista_id')->constrained('listas')->cascadeOnDelete();
                $table->unique(['tercero_id', 'lista_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('tercero_fabricantes');
        Schema::dropIfExists('tercero_sistemas');
        Schema::dropIfExists('tercero_maquina');
        Schema::dropIfExists('direcciones');
        Schema::dropIfExists('personal_access_tokens');
    }
};
