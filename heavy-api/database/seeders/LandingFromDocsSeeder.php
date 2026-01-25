<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use App\Models\CategoriaLanding;
use App\Models\SubcategoriaLanding;
use Illuminate\Support\Str;

class LandingFromDocsSeeder extends Seeder
{
    public function run()
    {
        // Limpiar tablas existentes
        SubcategoriaLanding::query()->delete();
        CategoriaLanding::query()->delete();

        // 1. Cargar el JSON con la información oficial
        $jsonPath = base_path('docs/categories.json');
        
        if (!File::exists($jsonPath)) {
            $this->command->error("No se encontró el archivo de datos: $jsonPath");
            return;
        }

        $jsonData = json_decode(File::get($jsonPath), true);
        if (!$jsonData || !isset($jsonData['categorias'])) {
            $this->command->error("Formato JSON inválido en categories.json");
            return;
        }

        // 2. Preparar el escaneo de imágenes (para asociarlas a los datos oficiales)
        $disk = Storage::disk('public');
        $baseDir = 'landing';
        
        // Mapeo de slugs a rutas de imagen encontradas en disco
        // Estructura: ['categoria_slug' => ['subcat_slug' => 'path/to/image.jpg']]
        $imageMap = $this->buildImageMap($disk, $baseDir);

        // 3. Iterar sobre el JSON oficial e insertar datos
        foreach ($jsonData['categorias'] as $catData) {
            $nombreCat = $catData['nombre'];
            $catSlug = Str::slug($nombreCat);
            
            // Buscar una descripción general (algunas cats en el JSON tienen, otras no)
            // El JSON tiene una estructura un poco rara a veces, vamos a normalizar
            $descGeneral = $catData['descripcion_general'] ?? "Encuentre los mejores repuestos de $nombreCat para su maquinaria.";
            
            // Limpiar citas [cite: ...] de la descripción
            $descGeneral = $this->cleanText($descGeneral);

            $categoria = CategoriaLanding::create([
                'nombre' => $nombreCat,
                'descripcion_general' => $descGeneral
            ]);

            $this->command->info("Categoría creada (Oficial): $nombreCat");

            if (isset($catData['subcategorias'])) {
                foreach ($catData['subcategorias'] as $subData) {
                    $nombreSub = $subData['nombre'];
                    $subSlug = Str::slug($nombreSub);
                    $descSub = $this->cleanText($subData['descripcion']);
                    
                    // Intentar encontrar la imagen correspondiente
                    // 1. Buscar coincidencia exacta del slug de subcategoria dentro de la carpeta de categoria
                    // 2. Buscar coincidencia aproximada
                    $imagePath = $this->findImageForSubcategory($imageMap, $catSlug, $subSlug);
                    
                    // Si no encuentra imagen, usar placeholder o null? 
                    // El requerimiento previo era vital que tuvieran imagen.
                    // Si retorna null, Angular mostrará el placeholder por defecto.

                    SubcategoriaLanding::create([
                        'categoria_id' => $categoria->id,
                        'nombre' => $nombreSub,
                        'descripcion' => $descSub,
                        'imagen' => $imagePath, 
                        'mostrar_en_navbar' => true,
                        'orden_navbar' => 0
                    ]);
                }
            }
        }
        
        $this->command->info("Migración de datos oficiales completada.");
    }

    private function buildImageMap($disk, $baseDir)
    {
        $map = [];
        if (!$disk->exists($baseDir)) return $map;

        $directories = $disk->directories($baseDir);
        foreach ($directories as $dirPath) {
            // $dirPath = landing/hidraulicos
            // folderSlug = hidraulicos
            $folderName = basename($dirPath); 
            // Normalizar slug de carpeta (a veces tienen nombres ligeramente distintos al JSON)
            // Ej JSON: "Hidráulicos", Carpeta: "hidraulicos" (coincide)
            // Ej JSON: "Herramienta de Corte", Carpeta: "herramienta-de-corte" (coincide al slugify)
            
            $files = $disk->files($dirPath);
            foreach ($files as $filePath) {
                // landing/hidraulicos/bomba-1.jpg
                if (Str::startsWith(basename($filePath), '.')) continue;
                
                $fileName = pathinfo($filePath, PATHINFO_FILENAME);
                // fileSlug = bomba-1
                // Quitamos números y sufijos para facilitar el match
                // bomba-1 -> bomba
                $cleanName = preg_replace('/-\d+$/', '', $fileName); 
                
                $map[$folderName][$fileName] = $filePath;
                // También guardamos una version "bomba" para matches mas generales
                if (!isset($map[$folderName][$cleanName])) {
                    $map[$folderName][$cleanName] = $filePath;
                }
            }
        }
        return $map;
    }

    private function findImageForSubcategory($imageMap, $catSlug, $subSlug)
    {
        // Nota: Los slugs del JSON y las carpetas pueden no coincidir al 100%
        // Intentaremos varias estrategias de coincidencia
        
        // Estrategia 1: Coincidencia directa de categoria
        if (isset($imageMap[$catSlug])) {
            // Buscar subcategoria dentro (exacta o parcial)
            return $this->searchImageInSpecificFolder($imageMap[$catSlug], $subSlug);
        }
        
        // Estrategia 2: La carpeta puede tener un nombre ligeramente distinto
        // Ej: JSON "transmisiones", Carpeta "transmisiones"
        // Ej: JSON "chasis y articulaciones", Carpeta "chasis-y-articulaciones"
        // Ej: JSON "accesorios-motor", Carpeta "accesorios-para-motor"

        // Normalizar catSlug para comparación
        $catParts = explode('-', $catSlug);
        
        foreach ($imageMap as $folderKey => $files) {
            // 0. Match exacto de carpeta (prioridad máxima)
            if ($folderKey === $catSlug) {
                 $result = $this->searchImageInSpecificFolder($files, $subSlug);
                 if ($result) return $result;
                 
                 // Si es la carpeta exacta y no encontramos imagen especifica,
                 // DEVOLVEMOS CUALQUIERA AHORA MISMO.
                 if (!empty($files)) return reset($files);
            }

            // 1. Check directo si contiene
            if (Str::contains($folderKey, $catSlug) || Str::contains($catSlug, $folderKey)) {
                 $result = $this->searchImageInSpecificFolder($files, $subSlug);
                 if ($result) return $result;
                 continue; 
            }

            // 2. Check por tokens (palabras)
            $folderParts = explode('-', $folderKey);
            $intersect = array_intersect($catParts, $folderParts);
            
            // Si comparten la mayoría de las palabras importantes (más del 60% o al menos 2 palabras clave)
            $matchCount = count($intersect);
            $totalParts = count($catParts);
            
            if ($matchCount >= 2 || ($totalParts > 0 && ($matchCount / $totalParts) > 0.6)) {
                 $result = $this->searchImageInSpecificFolder($files, $subSlug);
                 if ($result) return $result;
            }
            
            // 3. Similar_text como último recurso para la carpeta
            similar_text($catSlug, $folderKey, $percent);
            if ($percent > 80) {
                 $result = $this->searchImageInSpecificFolder($files, $subSlug);
                 if ($result) return $result;
                 
                 // Fallback de Categoría:
                 // Si encontramos la carpeta de la categoría pero no la imagen específica de la subcategoría,
                 // devolvemos CUALQUIER imagen de esa carpeta para evitar el 404.
                 // Preferiblemente una que no sea 'bomba-de-agua' para 'ripper', pero dentro de la misma categoria es aceptable.
                 if (!empty($files)) {
                     return reset($files);
                 }
            }
            
            // Si hicimos match por tokens (paso 2), también aplicamos este fallback
            if (isset($matchCount) && ($matchCount >= 2 || ($totalParts > 0 && ($matchCount / $totalParts) > 0.6))) {
                 if (!empty($files)) {
                     return reset($files);
                 }
            }
        }

        // Si no encontramos nada en los mapeos normales, intentar Fallback de Carpeta Cruzada
        $fallbackFolder = $this->getFallbackFolder($catSlug);
        if ($fallbackFolder && isset($imageMap[$fallbackFolder])) {
             // Buscar en la carpeta fallback
             // Primero intentamos buscar match especifico
             $res = $this->searchImageInSpecificFolder($imageMap[$fallbackFolder], $subSlug);
             if ($res) return $res;
             
             // Si no, devolvemos CUALQUIERA de la carpeta fallback
             if (!empty($imageMap[$fallbackFolder])) {
                 return reset($imageMap[$fallbackFolder]);
             }
        }

        return null;
    }


    private function cleanText($text)
    {
        // Remover referencias [cite: ...] y [cite_start]
        // Ejemplo: "... vida útil. [cite_start]Es la solución... [cite: 6, 7]"
        // Queremos mantener el texto pero quitar los marcadores
        
        $text = str_replace('[cite_start]', '', $text);
        return preg_replace('/\[cite:.*?\]/', '', $text);
    }
    
    private function searchImageInSpecificFolder($files, $subSlug) {
         // Logica existente...
         
         // 1. Match exacto
         if (isset($files[$subSlug])) return $files[$subSlug];
         
         // Normalizar strings
        $normalizedSubSlug = str_replace('-', '', $subSlug);

        // 2. Match parcial
        $parts = explode('-', $subSlug);
        
        foreach ($files as $name => $path) {
            $normalizedName = str_replace(['-', '_'], '', $name);
            $normalizedNameNoNum = preg_replace('/\d+$/', '', $normalizedName);

            if (Str::contains($normalizedName, $normalizedSubSlug) || Str::contains($normalizedSubSlug, $normalizedNameNoNum)) {
                return $path;
            }

            $matches = 0;
            foreach ($parts as $part) {
                if (strlen($part) > 3 && Str::contains($name, $part)) {
                    $matches++;
                }
            }
            
            if ($matches >= count($parts) - 1 && $matches > 0) {
                return $path;
            }
            
            similar_text($subSlug, $name, $percent);
            if ($percent > 55) {
                 return $path;
            }
        }
        
        // Return null if strictly searching
        return null;
    }

    private function getFallbackFolder($catSlug) {
        // Mapeo de categorías vacías o problemáticas a carpetas que SI tienen imágenes
        // Clave: slug de la categoría (JSON)
        // Valor: nombre de la carpeta FÍSICA en storage (keys de $imageMap)
        $fallbacks = [
            'perforadores' => 'martillos-hidraulicos', 
            'empaquetaduras-hidraulicas' => 'electricos', // En electricos vi empaquetaduras tambien
            'turboalimentadores' => 'accesorios-para-motor', // Nombre carpeta real tiene 'para'
            'transmisiones' => 'transmisiones',
            'montacargas' => 'montacargas', 
        ];
        
        return $fallbacks[$catSlug] ?? null;
    }
}
