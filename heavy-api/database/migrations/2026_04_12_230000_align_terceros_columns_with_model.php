<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Alinea columnas de `terceros` con el modelo/API (nombre, numero_documento, tipo).
 * Entornos que crearon la tabla con el stub de testing usaban documento/razon_social/tipo_tercero.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('terceros')) {
            return;
        }

        if (Schema::hasColumn('terceros', 'razon_social') && ! Schema::hasColumn('terceros', 'nombre')) {
            Schema::table('terceros', function (Blueprint $table): void {
                $table->renameColumn('razon_social', 'nombre');
            });
        }

        if (Schema::hasColumn('terceros', 'documento') && ! Schema::hasColumn('terceros', 'numero_documento')) {
            Schema::table('terceros', function (Blueprint $table): void {
                $table->renameColumn('documento', 'numero_documento');
            });
        }

        if (! Schema::hasColumn('terceros', 'tipo')) {
            Schema::table('terceros', function (Blueprint $table): void {
                $table->string('tipo', 30)->nullable();
            });

            if (Schema::hasColumn('terceros', 'es_cliente') && Schema::hasColumn('terceros', 'es_proveedor')) {
                DB::table('terceros')->orderBy('id')->chunkById(100, function ($rows): void {
                    foreach ($rows as $row) {
                        $esC = (bool) ($row->es_cliente ?? false);
                        $esP = (bool) ($row->es_proveedor ?? false);
                        $tipo = match (true) {
                            $esC && $esP => 'Ambos',
                            $esP => 'Proveedor',
                            default => 'Cliente',
                        };
                        DB::table('terceros')->where('id', $row->id)->update(['tipo' => $tipo]);
                    }
                });
            } else {
                DB::table('terceros')->whereNull('tipo')->update(['tipo' => 'Cliente']);
            }
        }

        Schema::table('terceros', function (Blueprint $table): void {
            if (! Schema::hasColumn('terceros', 'country_id')) {
                $table->unsignedBigInteger('country_id')->nullable();
            }
            if (! Schema::hasColumn('terceros', 'state_id')) {
                $table->unsignedBigInteger('state_id')->nullable();
            }
            if (! Schema::hasColumn('terceros', 'city_id')) {
                $table->unsignedBigInteger('city_id')->nullable();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('terceros')) {
            return;
        }

        Schema::table('terceros', function (Blueprint $table): void {
            foreach (['city_id', 'state_id', 'country_id'] as $col) {
                if (Schema::hasColumn('terceros', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        if (Schema::hasColumn('terceros', 'tipo')) {
            Schema::table('terceros', function (Blueprint $table): void {
                $table->dropColumn('tipo');
            });
        }

        if (Schema::hasColumn('terceros', 'numero_documento') && ! Schema::hasColumn('terceros', 'documento')) {
            Schema::table('terceros', function (Blueprint $table): void {
                $table->renameColumn('numero_documento', 'documento');
            });
        }

        if (Schema::hasColumn('terceros', 'nombre') && ! Schema::hasColumn('terceros', 'razon_social')) {
            Schema::table('terceros', function (Blueprint $table): void {
                $table->renameColumn('nombre', 'razon_social');
            });
        }
    }
};
