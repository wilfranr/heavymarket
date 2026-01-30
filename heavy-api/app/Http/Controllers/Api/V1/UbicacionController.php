<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\City;
use App\Models\Country;
use App\Models\State;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controlador para la gestión de ubicaciones geográficas
 */
class UbicacionController extends Controller
{
    /**
     * Obtener lista de países
     *
     * @return JsonResponse
     */
    public function countries(): JsonResponse
    {
        $countries = Country::where('is_active', true)
            ->orderBy('name', 'asc')
            ->get(['id', 'name', 'iso2', 'phonecode']);

        return response()->json([
            'data' => $countries
        ]);
    }

    /**
     * Obtener lista de departamentos (estados)
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function states(Request $request): JsonResponse
    {
        $query = State::query();

        if ($request->filled('country_id')) {
            $query->where('country_id', $request->input('country_id'));
        }

        $states = $query->orderBy('name', 'asc')->get(['id', 'name', 'country_id']);

        return response()->json([
            'data' => $states
        ]);
    }

    /**
     * Obtener lista de ciudades
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function cities(Request $request): JsonResponse
    {
        $query = City::query();

        if ($request->filled('state_id')) {
            $query->where('state_id', $request->input('state_id'));
        }

        if ($request->filled('country_id')) {
            $query->where('country_id', $request->input('country_id'));
        }

        $cities = $query->orderBy('name', 'asc')->get(['id', 'name', 'state_id', 'country_id']);

        return response()->json([
            'data' => $cities
        ]);
    }
}
