<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\TRM;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Servicio para la integración con APIs externas de TRM
 */
class TrmIntegrationService
{
    /**
     * URL de la API de Socrata para la TRM de Colombia
     */
    private const API_URL = 'https://www.datos.gov.co/resource/ceyp-9c7c.json';

    /**
     * Sincroniza la TRM más reciente desde la API
     */
    public function syncLatestTrm(): ?TRM
    {
        try {
            $response = Http::get(self::API_URL, [
                '$order' => 'vigenciadesde DESC',
                '$limit' => 1,
            ]);

            if ($response->successful() && ! empty($response->json())) {
                $data = $response->json()[0];
                $valor = (float) $data['valor'];
                $fecha = Carbon::parse($data['vigenciadesde'])->format('Y-m-d');

                return TRM::updateOrCreate(
                    ['fecha' => $fecha],
                    ['trm' => $valor]
                );
            }

            Log::error('Error al sincronizar TRM: Respuesta no exitosa o vacía de la API.');

            return null;

        } catch (\Exception $e) {
            Log::error('Excepción al sincronizar TRM: '.$e->getMessage());

            return null;
        }
    }

    /**
     * Sincroniza la TRM de una fecha específica
     *
     * @param  string  $date  Formato Y-m-d
     */
    public function syncByDate(string $date): ?TRM
    {
        try {
            // Socrata usa ISO 8601 para fechas
            $fechaIso = $date.'T00:00:00.000';

            $response = Http::get(self::API_URL, [
                'vigenciadesde' => $fechaIso,
            ]);

            if ($response->successful() && ! empty($response->json())) {
                $data = $response->json()[0];
                $valor = (float) $data['valor'];

                return TRM::updateOrCreate(
                    ['fecha' => $date],
                    ['trm' => $valor]
                );
            }

            return null;

        } catch (\Exception $e) {
            Log::error("Error al sincronizar TRM para la fecha {$date}: ".$e->getMessage());

            return null;
        }
    }
}
