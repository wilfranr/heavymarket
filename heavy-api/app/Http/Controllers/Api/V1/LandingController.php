<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CategoriaLanding;
use Illuminate\Http\Request;

class LandingController extends Controller
{
    /**
     * Obtener categorías de la landing con sus subcategorías.
     */
    public function index()
    {
        $categorias = CategoriaLanding::with(['subcategorias' => function ($query) {
            $query->where('mostrar_en_navbar', true)
                  ->orderBy('orden_navbar', 'asc')
                  ->orderBy('nombre', 'asc');
        }])
        ->orderBy('nombre', 'asc')
        ->get();

        // Transformar para incluir urls de imágenes y slugs que son attributos virtuales
        // Aunque al usar toArray() Laravel debería incluirlos si están en $appends
        
        return response()->json($categorias);
    }
}
