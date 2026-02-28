<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\SubcategoriaLanding;
use Illuminate\Support\Facades\File;

class NormalizeLandingImagesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'landing:normalize-images';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Renombra las imágenes y carpetas de la landing a formato slug (kebab-case) y actualiza la base de datos.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Iniciando normalización de imágenes y rutas...');

        $disk = Storage::disk('public');
        $basePath = 'landing';

        if (!$disk->exists($basePath)) {
            $this->error("El directorio {$basePath} no existe en public.");
            return;
        }

        // 1. Rename files physically
        $this->info('Renombrando archivos en el Storage...');
        $allFiles = $disk->allFiles($basePath);
        $renamedFilesCount = 0;

        foreach ($allFiles as $file) {
            $parts = explode('/', $file);
            $newParts = [];
            
            foreach ($parts as $index => $part) {
                if ($index === count($parts) - 1) {
                    // Es el archivo
                    $filename = pathinfo($part, PATHINFO_FILENAME);
                    $extension = pathinfo($part, PATHINFO_EXTENSION);
                    $newFilename = Str::slug($filename);
                    $newParts[] = $newFilename . '.' . strtolower($extension);
                } else {
                    // Es un directorio
                    $newParts[] = Str::slug($part);
                }
            }
            
            $newPath = implode('/', $newParts);
            
            if ($file !== $newPath) {
                $newDir = dirname($newPath);
                if (!$disk->exists($newDir)) {
                    $disk->makeDirectory($newDir);
                }
                
                $disk->move($file, $newPath);
                $this->line("Renombrado: {$file} -> {$newPath}");
                $renamedFilesCount++;
            }
        }

        $this->info("Archivos renombrados en total: {$renamedFilesCount}");

        // Limpiar carpetas vacías (las antiguas que quedaron después de mover los archivos)
        $this->info('Limpiando carpetas vacías...');
        $allDirs = $disk->allDirectories($basePath);
        
        // Ordenar de mayor a menor longitud para eliminar desde las ramas hijas hacia la raíz
        usort($allDirs, function($a, $b) {
            return strlen($b) - strlen($a);
        });

        foreach ($allDirs as $dir) {
            // Si no tiene archivos (incluyendo en subcarpetas), se elimina
            if (count($disk->allFiles($dir)) === 0) {
                $disk->deleteDirectory($dir);
            }
        }

        // 2. Update the Database
        $this->info('Actualizando registros en la base de datos...');
        $subcategorias = SubcategoriaLanding::all();
        $updated = 0;

        SubcategoriaLanding::withoutEvents(function () use ($subcategorias, &$updated) {
            foreach ($subcategorias as $sub) {
                $current = $sub->getRawOriginal('imagen');
                if ($current && $current !== 'no-image.png') {
                    $parts = explode('/', $current);
                    $newParts = [];
                    foreach ($parts as $index => $part) {
                        if ($index === count($parts) - 1) {
                            $filename = pathinfo($part, PATHINFO_FILENAME);
                            $extension = pathinfo($part, PATHINFO_EXTENSION);
                            $newParts[] = Str::slug($filename) . '.' . strtolower($extension);
                        } else {
                            $newParts[] = Str::slug($part);
                        }
                    }
                    $newPath = implode('/', $newParts);
                    
                    if ($current !== $newPath) {
                        $sub->imagen = $newPath;
                        $sub->save();
                        $updated++;
                    }
                }
            }
        });

        $this->info("Base de datos actualizada. Registros modificados: {$updated}");

        // 3. Update Config and Seeders si estamos en entorno de desarrollo local
        if (app()->environment('local')) {
            $this->updateConfigAndSeeders();
        }

        $this->info('¡Proceso completado con éxito!');
    }

    private function updateConfigAndSeeders()
    {
        $this->info('Actualizando archivo de configuración (config/productos_imagenes.php) y seeders locales...');
        
        $configPath = config_path('productos_imagenes.php');
        if (File::exists($configPath)) {
            $map = config('productos_imagenes');
            $newMap = [];
            foreach ($map as $key => $path) {
                if ($path === 'no-image.png') {
                    $newMap[$key] = $path;
                    continue;
                }
                
                $parts = explode('/', $path);
                $newParts = [];
                foreach ($parts as $index => $part) {
                    if ($index === count($parts) - 1) {
                        $filename = pathinfo($part, PATHINFO_FILENAME);
                        $extension = pathinfo($part, PATHINFO_EXTENSION);
                        $newParts[] = Str::slug($filename) . '.' . strtolower($extension);
                    } else {
                        $newParts[] = Str::slug($part);
                    }
                }
                
                $newMap[$key] = implode('/', $newParts);
            }
            
            $export = "<?php\n\nreturn " . var_export($newMap, true) . ";\n";
            File::put($configPath, $export);
            $this->line('Configuración productos_imagenes.php actualizada.');
        }

        $seederPath = database_path('seeders/subcategorias_data.json');
        if (File::exists($seederPath)) {
            $subcategorias = SubcategoriaLanding::all()->toArray();
            File::put($seederPath, json_encode($subcategorias, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
            $this->line('Seeder subcategorias_data.json actualizado.');
        }
    }
}
