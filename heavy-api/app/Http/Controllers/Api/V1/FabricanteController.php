<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Fabricante;
use Illuminate\Http\{JsonResponse, Request};

class FabricanteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $fabricantes = Fabricante::orderBy('nombre')
            ->paginate($request->input('per_page', 15));

        return response()->json(['data' => $fabricantes->items(), 'total' => $fabricantes->total()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate(['nombre' => ['required', 'string', 'max:255', 'unique:fabricantes,nombre']]);
        $fabricante = Fabricante::create($validated);

        return response()->json(['data' => $fabricante, 'message' => 'Fabricante creado exitosamente'], 201);
    }

    public function show(Fabricante $fabricante): JsonResponse
    {
        return response()->json(['data' => $fabricante]);
    }

    public function update(Request $request, Fabricante $fabricante): JsonResponse
    {
        $validated = $request->validate(['nombre' => ['sometimes', 'string', 'max:255']]);
        $fabricante->update($validated);

        return response()->json(['data' => $fabricante, 'message' => 'Fabricante actualizado']);
    }

    public function destroy(Fabricante $fabricante): JsonResponse
    {
        $fabricante->delete();
        return response()->json(['message' => 'Fabricante eliminado'], 204);
    }
}
