<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Lista;
use Illuminate\Support\Facades\File;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class LandingBrandImageService
{
    /** Ancho máximo de miniatura (aprox. 2x del área visible ~148px). */
    public const DEFAULT_MAX_WIDTH = 280;

    /** Alto máximo de miniatura (aprox. 2x del área visible ~68px). */
    public const DEFAULT_MAX_HEIGHT = 136;

    /**
     * @return array{url: string, width: int, height: int}|null
     */
    public function logoMeta(Lista $lista, int $maxWidth = self::DEFAULT_MAX_WIDTH, int $maxHeight = self::DEFAULT_MAX_HEIGHT): ?array
    {
        $path = $this->getOrCreateThumbnail($lista, $maxWidth, $maxHeight);
        if ($path === null) {
            return null;
        }

        $info = @getimagesize($path);
        if ($info === false) {
            return null;
        }

        return [
            'url' => url("v1/landing/brands/{$lista->id}/logo"),
            'width' => $info[0],
            'height' => $info[1],
        ];
    }

    public function logoUrl(Lista $lista): ?string
    {
        $meta = $this->logoMeta($lista);

        return $meta['url'] ?? null;
    }

    public function streamLogo(Lista $lista, int $maxWidth, int $maxHeight = self::DEFAULT_MAX_HEIGHT): BinaryFileResponse
    {
        abort_unless($lista->tipo === 'Fabricantes', 404);

        $path = $this->getOrCreateThumbnail($lista, $maxWidth, $maxHeight);
        abort_if($path === null, 404);

        return response()->file($path, [
            'Content-Type' => File::mimeType($path) ?: 'image/png',
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
    }

    private function getOrCreateThumbnail(Lista $lista, int $maxWidth, int $maxHeight): ?string
    {
        $source = $this->resolveSourcePath($lista);
        if ($source === null) {
            return null;
        }

        $maxWidth = max(80, min(560, $maxWidth));
        $maxHeight = max(40, min(280, $maxHeight));
        $cacheDir = storage_path('app/cache/landing-brand-logos');
        if (! is_dir($cacheDir)) {
            mkdir($cacheDir, 0755, true);
        }

        $signature = md5($source.filemtime($source)."{$maxWidth}x{$maxHeight}");
        $cachePath = "{$cacheDir}/{$lista->id}_{$maxWidth}x{$maxHeight}_{$signature}.png";

        if (is_file($cachePath)) {
            return $cachePath;
        }

        $info = @getimagesize($source);
        if ($info === false) {
            return null;
        }

        $sourceImage = $this->createImageFromFile($source, $info[2]);
        if ($sourceImage === null) {
            return null;
        }

        $width = imagesx($sourceImage);
        $height = imagesy($sourceImage);

        $scale = min(1.0, $maxWidth / $width, $maxHeight / $height);

        if ($scale >= 1.0) {
            imagepng($sourceImage, $cachePath);
            imagedestroy($sourceImage);

            return $cachePath;
        }

        $newWidth = max(1, (int) round($width * $scale));
        $newHeight = max(1, (int) round($height * $scale));
        $resized = imagecreatetruecolor($newWidth, $newHeight);
        imagealphablending($resized, false);
        imagesavealpha($resized, true);
        $transparent = imagecolorallocatealpha($resized, 0, 0, 0, 127);
        imagefill($resized, 0, 0, $transparent);
        imagecopyresampled($resized, $sourceImage, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
        imagepng($resized, $cachePath);
        imagedestroy($sourceImage);
        imagedestroy($resized);

        return $cachePath;
    }

    private function createImageFromFile(string $path, int $type): ?\GdImage
    {
        return match ($type) {
            IMAGETYPE_PNG => imagecreatefrompng($path),
            IMAGETYPE_JPEG => imagecreatefromjpeg($path),
            IMAGETYPE_WEBP => \function_exists('imagecreatefromwebp') ? imagecreatefromwebp($path) : null,
            IMAGETYPE_GIF => imagecreatefromgif($path),
            default => null,
        };
    }

    private function resolveSourcePath(Lista $lista): ?string
    {
        $value = $lista->getRawOriginal('foto');
        if (! $value || str_starts_with($value, 'http')) {
            return null;
        }

        $publicRoot = storage_path('app/public/');

        if (str_contains($value, '/')) {
            $path = $publicRoot.$value;

            return is_file($path) ? $path : null;
        }

        $legacy = $publicRoot."Aplicativo/01. Fabricantes/{$value}";
        if (is_file($legacy)) {
            return $legacy;
        }

        $fabricante = $lista->fabricante;
        if ($fabricante) {
            $nameSlug = str_replace([' ', '-', '.'], '', strtolower($fabricante->nombre));
            $patternName = "fab-{$nameSlug}.png";
            $patternPath = $publicRoot."Aplicativo/01. Fabricantes/{$patternName}";
            if (is_file($patternPath)) {
                return $patternPath;
            }
        }

        $fallback = $publicRoot.$value;

        return is_file($fallback) ? $fallback : null;
    }
}
