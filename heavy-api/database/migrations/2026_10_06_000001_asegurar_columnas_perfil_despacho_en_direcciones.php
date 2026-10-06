<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * La migracion 2026_04_12_235000_create_personal_access_tokens_and_tercero_pivot_tables
 * solo crea la tabla 'direcciones' completa si esta no existia aun
 * (if (! Schema::hasTable('direcciones'))). En bases de datos donde 'direcciones'
 * ya existia desde antes con el esquema minimo (id, direccion, city_id, state_id,
 * country_id, principal, tercero_id), esa migracion queda marcada como 'Ran' sin
 * haber agregado nunca destinatario/nit_cc/transportadora_id/forma_pago/telefono/
 * ciudad_texto -- los campos del "perfil de despacho" (#172/#179). Esta migracion
 * los agrega de forma idempotente, sin depender de que 'telefono' ya exista.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('direcciones', function (Blueprint $table) {
            if (! Schema::hasColumn('direcciones', 'destinatario')) {
                $table->string('destinatario')->nullable();
            }
            if (! Schema::hasColumn('direcciones', 'nit_cc')) {
                $table->string('nit_cc')->nullable();
            }
            if (! Schema::hasColumn('direcciones', 'transportadora_id')) {
                $table->unsignedBigInteger('transportadora_id')->nullable();
            }
            if (! Schema::hasColumn('direcciones', 'forma_pago')) {
                $table->string('forma_pago')->nullable();
            }
            if (! Schema::hasColumn('direcciones', 'telefono')) {
                $table->string('telefono')->nullable();
            }
            if (! Schema::hasColumn('direcciones', 'ciudad_texto')) {
                $table->string('ciudad_texto')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('direcciones', function (Blueprint $table) {
            foreach (['destinatario', 'nit_cc', 'transportadora_id', 'forma_pago', 'telefono', 'ciudad_texto'] as $column) {
                if (Schema::hasColumn('direcciones', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
