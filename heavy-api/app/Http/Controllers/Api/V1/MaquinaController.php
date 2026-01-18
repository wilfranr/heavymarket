<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Maquina;
use Illuminate\Http\{JsonResponse, Request};

class MaquinaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $maquinas = Maquina::orderBy('nombre')
            ->paginate($request->input('per_page', 15));

        return response()->json(['data' => $maquinas->items(), 'total' => $maquinas->total()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate(['nombre' => ['required', 'string', 'max:255']]);
        $maquina = Maquina::create($validated);

        return response()->json(['data' => $maquina, 'message' => 'Máquina creada exitosamente'], 201);
    }

    public function show(Maquina $maquina): JsonResponse
    {
        return response()->json(['data' => $maquina]);
    }

    public function update(Request $request, Maquina $maquina): JsonResponse
    {
        $validated = $request->validate(['nombre' => ['sometimes', 'string', 'max:255']]);
        $maquina->update($validated);

        return response()->json(['data' => $maquina, 'message' => 'Máquina actualizada']);
    }

    public function destroy(Maquina $maquina): JsonResponse
    {
        $maquina->delete();
        return response()->json(['message' => 'Máquina eliminada'], 204);
    }
}
