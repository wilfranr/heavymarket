<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class MigrateImagesFromRepo extends Command
{
    protected $signature = 'landing:migrate-images';
    protected $description = 'Migrate and normalize images from "Pagina web" folder to storage/app/public/landing';

    public function handle()
    {
        $sourceBase = base_path('../Pagina web'); // Asumiendo estructura de carpetas
        $targetBase = storage_path('app/public/landing');

        if (!File::exists($sourceBase)) {
            $this->error("Source directory not found: $sourceBase");
            // Try relative to current cwd if executing from api root
            $sourceBase = base_path('../Pagina web');
             if (!File::exists($sourceBase)) {
                 $this->error("Source directory 'Pagina web' not found relative to project root.");
                 return;
             }
        }

        // Limpiar directorio destino para evitar duplicados viejos? Mejor no, sobreescribimos.
        if (!File::exists($targetBase)) {
            File::makeDirectory($targetBase, 0755, true);
        }

        $directories = File::directories($sourceBase);

        foreach ($directories as $dir) {
            $dirName = basename($dir);
            // $dirName ej: "08 Accesorios para motor"
            
            // 1. Normalizar nombre carpeta destino
            // Quitar numeros iniciales "01 "
            $cleanDirName = preg_replace('/^\d+\s+/', '', $dirName);
            // Convertir a slug "accesorios-para-motor"
            $targetDirSlug = Str::slug($cleanDirName);
            
            $targetDirPath = "$targetBase/$targetDirSlug";
            
            if (!File::exists($targetDirPath)) {
                File::makeDirectory($targetDirPath, 0755, true);
            }
            
            $files = File::files($dir);
            
            foreach ($files as $file) {
                $filename = $file->getFilename();
                
                // 2. Corregir Typos comunes en nombres de archivo
                $newFilename = $this->fixTypos($filename);
                
                // 3. Normalizar nombre archivo (slugify pero manteniendo extension)
                $ext = $file->getExtension();
                $nameOnly = pathinfo($newFilename, PATHINFO_FILENAME);
                $cleanName = Str::slug($nameOnly) . '.' . $ext;
                
                // Copiar
                File::copy($file->getPathname(), "$targetDirPath/$cleanName");
                $this->info("Copied: $dirName/$filename -> $targetDirSlug/$cleanName");
            }
        }
        
        $this->info("Migration completed.");
    }

    private function fixTypos($filename)
    {
        $replacements = [
            'bonba' => 'bomba',
            'fucibles' => 'fusibles',
            'caneles' => 'mangueras', // "caneles" puede ser canales o mangueras? en mangueras hay "mangeras"
            'mangeras' => 'mangueras',
            'admicion' => 'admision',
            'escapr' => 'escape',
            'infriadores' => 'enfriadores',
            'compreslr' => 'compresor',
            'condesador' => 'condensador',
            'aciento' => 'asiento',
            'operado' => 'operador',
            'comtrol' => 'control',
            'panele' => 'paneles',
            'paravi' => 'parabrisas',
            'direcion' => 'direccion',
            'dirreccion' => 'direccion',
            'cilindreo' => 'cilindro',
            'balbula' => 'valvula',
            'acomulador' => 'acumulador',
            'piatones' => 'pistones',
            'diagframa' => 'diafragma',
            'instruciones' => 'instrucciones',
            'intrucciones' => 'instrucciones',
            'unudad' => 'unidad',
            'herraminta' => 'herramienta',
            'motonibeladora' => 'motoniveladora',
            'proctector' => 'protector',
            'balse' => 'balde',
        ];

        $lowerName = strtolower($filename);
        foreach ($replacements as $typo => $fix) {
            $lowerName = str_replace($typo, $fix, $lowerName);
        }
        
        return $lowerName;
    }
}
