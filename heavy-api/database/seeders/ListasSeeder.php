<?php

namespace Database\Seeders;

use App\Models\Lista;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class ListasSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $path = __DIR__.'/listas_data.json';

        if (! file_exists($path)) {
            $this->command->error("File not found: $path");

            return;
        }

        // Increase memory limit for this script as the JSON is large
        ini_set('memory_limit', '512M');

        $json = file_get_contents($path);

        // Check if file read was successful
        if ($json === false) {
            $this->command->error("Failed to read file: $path");

            return;
        }

        $data = json_decode($json, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->command->error('JSON Decode Error: '.json_last_error_msg());

            return;
        }

        if (empty($data)) {
            $this->command->error('Data is empty.');

            return;
        }

        $count = count($data);
        $this->command->info("Found {$count} records to process.");

        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        Lista::unguard();

        try {
            Lista::withoutEvents(function () use ($data) {
                foreach ($data as $item) {
                    Lista::withTrashed()->updateOrCreate(
                        ['id' => $item['id']],
                        Arr::only($item, [
                            'sistema_id',
                            'parent_id',
                            'tipo',
                            'nombre',
                            'definicion',
                            'foto',
                            'fotoMedida',
                            'created_at',
                            'updated_at',
                            'deleted_at',
                        ])
                    );
                }
            });
            $this->command->info("Processed {$count} records successfully.");
        } catch (\Exception $e) {
            $this->command->error('Error during processing: '.$e->getMessage());
        }

        Lista::reguard();

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    }
}
