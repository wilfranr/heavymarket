<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use App\Models\Lista;
use Illuminate\Http\File;
use RecursiveIteratorIterator;
use RecursiveDirectoryIterator;

class SyncMachineImages extends Command
{
    protected $signature = 'sync:machine-images';
    protected $description = 'Sync images from "Fotos Maquinaria" folder to lists table';

    public function handle()
    {
        // Adjust path to point to root of repo from inside heavy-api
        $sourcePath = base_path('../Fotos Maquinaria');

        if (!is_dir($sourcePath)) {
            $this->error("Directory not found: $sourcePath");
            // If running in production, maybe the folder is deployed differently?
            // But if it's in the repo root, it should be accessible relative to base_path('../')
            return 1;
        }

        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($sourcePath, RecursiveDirectoryIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if ($file->isFile() && in_array(strtolower($file->getExtension()), ['jpg', 'jpeg', 'png'])) {
                $filename = $file->getFilename();
                $nameWithoutExt = pathinfo($filename, PATHINFO_FILENAME);
                
                // Manual mapping for known discrepancies
                $manualMapping = [
                    'bulldozer' => 'bulldozers',
                    'retroexcavadora' => 'retroexcavadoras',
                    'zanjadora' => 'zanjadoras',
                    'cargador minero' => 'cargador mirero', // Typo in DB
                    'grua movil' => 'grúa movil',
                    'manipulador telescopico' => 'manipulador telescópico',
                    'martillo hidraulico' => 'martillo hidráulico',
                ];

                $searchName = strtolower($nameWithoutExt);
                $searchName = str_replace('_', ' ', $searchName);

                if (isset($manualMapping[$searchName])) {
                    $searchName = $manualMapping[$searchName];
                    $this->info("Using manual mapping: '$nameWithoutExt' -> '$searchName'");
                }

                $lista = Lista::where('tipo', 'Tipo de Máquina')
                    ->whereRaw('LOWER(nombre) = ?', [$searchName])
                    ->first();

                if (!$lista) {
                    // Try to find by removing accents from DB side (if possible) or just fuzzy match
                     $lista = Lista::where('tipo', 'Tipo de Máquina')
                        ->where('nombre', 'LIKE', $searchName) // Case insensitive by default in MySQL
                        ->first();
                }

                if ($lista) {
                    $this->info("Found match for: $filename -> ID: {$lista->id}");
                    
                    try {
                        // Store the file and get the path
                        $path = Storage::disk('public')->putFile('listas', new File($file->getPathname()));
                        
                        if ($path) {
                            $lista->foto = $path;
                            $lista->save();
                            $this->info("Updated image for {$lista->nombre}: $path");
                        } else {
                            $this->error("Failed to store file: $filename");
                        }
                    } catch (\Exception $e) {
                         $this->error("Exception storing file $filename: " . $e->getMessage());
                    }

                } else {
                    $this->warn("No matching list found for image: $filename (searched for '$nameWithoutExt')");
                }
            }
        }

        $this->info('Sync completed.');
        return 0;
    }
}
