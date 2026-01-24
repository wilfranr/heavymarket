<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use App\Models\CategoriaLanding;
use App\Models\SubcategoriaLanding;
use Illuminate\Support\Str;

class LandingFromImagesSeeder extends Seeder
{
    public function run()
    {
        // Limpiar tablas existentes
        // Desactivar FK checks si es necesario, pero aquí usaremos delete para simplificar
        SubcategoriaLanding::query()->delete();
        CategoriaLanding::query()->delete();

        $disk = Storage::disk('public');
        $baseDir = 'landing';

        if (!$disk->exists($baseDir)) {
            $this->command->error("El directorio '$baseDir' no existe en storage/app/public.");
            return;
        }

        $directories = $disk->directories($baseDir);

        foreach ($directories as $dirPath) {
            // dirPath es ej: landing/hidraulicos
            $dirName = basename($dirPath); // hidraulicos
            
            // Crear Categoría
            $nombreCategoria = $this->formatName($dirName);
            $categoria = CategoriaLanding::create([
                'nombre' => $nombreCategoria,
                'descripcion_general' => "Todo en $nombreCategoria para maquinaria pesada."
            ]);

            $this->command->info("Categoria creada: $nombreCategoria");

            $files = $disk->files($dirPath);

            foreach ($files as $filePath) {
                // filePath es ej: landing/hidraulicos/bomba-1.png
                // Ignorar archivos ocultos o no imagenes (básico)
                if (Str::startsWith(basename($filePath), '.')) continue;

                $fileName = pathinfo($filePath, PATHINFO_FILENAME);
                $nombreSubcategoria = $this->formatName($fileName);
                
                // Crear Subcategoría
                SubcategoriaLanding::create([
                    'categoria_id' => $categoria->id,
                    'nombre' => $nombreSubcategoria,
                    'descripcion' => "Repuesto de alta calidad: $nombreSubcategoria",
                    'imagen' => $filePath, // Guardamos path relativo al disco public: landing/cat/file.png
                    'mostrar_en_navbar' => true, // Por defecto mostrar
                    'orden_navbar' => 0
                ]);
            }
        }
    }

    private function formatName($slug)
    {
        // hidraulicos-y-bombas -> Hidraulicos Y Bombas
        $name = str_replace(['-', '_'], ' ', $slug);
        return Str::title($name);
    }
}
