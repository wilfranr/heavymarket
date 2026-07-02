<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ClearPedidosData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:clear-pedidos-data {--force : Force the operation to run in production}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Limpia exclusivamente las tablas relacionadas con pedidos, cotizaciones, órdenes de compra y órdenes de trabajo (sin tocar maestros)';

    /**
     * Tables to be truncated in order (from dependent to parent)
     *
     * @var array
     */
    protected $tables = [
        // Ordenes Trabajo
        'orden_trabajo_referencias',
        'orden_trabajos',

        // Ordenes Compra
        'orden_compra_referencia',
        'orden_compras',

        // Cotizaciones
        'cotizacion_referencia_proveedores',
        'cotizaciones',

        // Pedidos
        'pedido_referencia_proveedor',
        'pedido_referencia_imagen',
        'pedido_referencia',
        'pedido_articulos',
        'pedidos',
    ];

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (app()->environment('production') && ! $this->option('force')) {
            $this->error('¡ADVERTENCIA! El entorno detectado es PRODUCCIÓN.');
            if (! $this->confirm('¿Deseas continuar? Usa --force para evitar esta advertencia.')) {
                $this->info('Operación cancelada.');

                return 1;
            }
        }

        $this->warn('ADVERTENCIA: Esta acción ELIMINARÁ PERMANENTEMENTE todos los registros de las siguientes tablas relacionadas con pedidos:');
        $this->bulletList($this->tables);

        if (! $this->confirm('¿Estás COMPLETAMENTE SEGURO de que quieres continuar?')) {
            $this->info('Operación cancelada.');

            return 0;
        }

        $this->info('Iniciando limpieza de datos de pedidos...');

        try {
            $driver = DB::getDriverName();

            // Desactivar restricciones de llaves foráneas para permitir TRUNCATE
            if ($driver === 'sqlite') {
                DB::statement('PRAGMA foreign_keys = OFF;');
            } else {
                DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            }

            foreach ($this->tables as $table) {
                if (Schema::hasTable($table)) {
                    $this->comment("Limpiando tabla: {$table}...");
                    DB::table($table)->truncate();
                } else {
                    $this->warn("La tabla {$table} no existe, saltando...");
                }
            }

            // Reactivar restricciones
            if ($driver === 'sqlite') {
                DB::statement('PRAGMA foreign_keys = ON;');
            } else {
                DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            }

            $this->info('-----------------------------------------');
            $this->info('¡Datos de pedidos limpiados con éxito!');
            $this->info('-----------------------------------------');

        } catch (\Exception $e) {
            $driver = DB::getDriverName();
            if ($driver === 'sqlite') {
                DB::statement('PRAGMA foreign_keys = ON;');
            } else {
                DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            }
            $this->error('Error durante la limpieza: '.$e->getMessage());

            return 1;
        }

        return 0;
    }

    /**
     * Helper to print a bullet list
     */
    private function bulletList(array $items)
    {
        foreach ($items as $item) {
            $this->line(" - {$item}");
        }
    }
}
