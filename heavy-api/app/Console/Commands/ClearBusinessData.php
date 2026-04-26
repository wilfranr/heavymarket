<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ClearBusinessData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:clear-business-data {--force : Force the operation to run in production}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Limpia las tablas de negocio solicitadas (referencias, articulos, pedidos, maquinas, terceros, cotizaciones, ordenes de compra/trabajo)';

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
        
        // Articulos
        'medidas',
        'articulo_juegos',
        'articulos_referencias',
        'articulos',
        
        // Maquinas
        'tercero_maquina',
        'maquinas',
        
        // Terceros
        'direcciones',
        'categoria_tercero',
        'tercero_fabricantes',
        'tercero_sistemas',
        'tercero_marcas',
        'tercero_categoria_comercial',
        'tercero_contacto',
        'terceros',
        
        // Referencias
        'referencias',
    ];

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (app()->environment('production') && !$this->option('force')) {
            $this->error('¡ADVERTENCIA! El entorno detectado es PRODUCCIÓN.');
            if (!$this->confirm('¿Deseas continuar? Usa --force para evitar esta advertencia.')) {
                $this->info('Operación cancelada.');
                return 1;
            }
        }

        $this->warn('ADVERTENCIA: Esta acción ELIMINARÁ PERMANENTEMENTE todos los registros de las siguientes tablas:');
        $this->bulletList($this->tables);

        if (!$this->confirm('¿Estás COMPLETAMENTE SEGURO de que quieres continuar?')) {
            $this->info('Operación cancelada.');
            return 0;
        }

        $this->info('Iniciando limpieza de base de datos...');

        try {
            // Desactivar restricciones de llaves foráneas para permitir TRUNCATE
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            foreach ($this->tables as $table) {
                if (Schema::hasTable($table)) {
                    $this->comment("Limpiando tabla: {$table}...");
                    DB::table($table)->truncate();
                } else {
                    $this->warn("La tabla {$table} no existe, saltando...");
                }
            }

            // Reactivar restricciones
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            
            $this->info('-----------------------------------------');
            $this->info('¡Base de datos limpiada con éxito!');
            $this->info('-----------------------------------------');
            
        } catch (\Exception $e) {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            $this->error("Error durante la limpieza: " . $e->getMessage());
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
