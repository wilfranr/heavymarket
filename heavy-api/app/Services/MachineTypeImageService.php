<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Lista;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MachineTypeImageService
{
    public function resolveImagenUrl(Lista $item): string
    {
        $rawFoto = $item->getRawOriginal('foto');

        if (! $rawFoto) {
            return $this->fallbackUrl();
        }

        if (Str::startsWith($rawFoto, ['http://', 'https://'])) {
            return $rawFoto;
        }

        foreach ($this->candidatePaths($rawFoto) as $path) {
            if ($this->fileExistsInPublicDisk($path)) {
                return Storage::disk('public')->url($path);
            }
        }

        return $this->fallbackUrl();
    }

    /**
     * @return list<string>
     */
    private function candidatePaths(string $rawFoto): array
    {
        if (str_contains($rawFoto, '/')) {
            return [$rawFoto];
        }

        return [
            'listas/'.$rawFoto,
            'Aplicativo/03. Tipos de Maquina/'.$rawFoto,
        ];
    }

    private function fileExistsInPublicDisk(string $path): bool
    {
        return Storage::disk('public')->exists($path);
    }

    private function fallbackUrl(): string
    {
        return asset('images/no-image.png');
    }
}
