<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CategoriaLanding;
use Illuminate\Http\Request;

class LandingController extends Controller
{
    /**
     * Obtener todas las categorías para administración (sin filtros)
     */
    public function adminIndex()
    {
        return CategoriaLanding::with(['subcategorias' => function ($query) {
            $query->orderBy('orden_navbar', 'asc')->orderBy('nombre', 'asc');
        }])
        ->orderBy('orden_navbar', 'asc')
        ->orderBy('nombre', 'asc')
        ->get();
    }

    /**
     * Obtener categorías de la landing con sus subcategorías.
     */
    public function index()
    {
        $categorias = CategoriaLanding::where('mostrar_en_navbar', true)
        ->orderBy('orden_navbar', 'asc')
        ->with(['subcategorias' => function ($query) {
            $query->where('mostrar_en_navbar', true)
                  ->orderBy('orden_navbar', 'asc')
                  ->orderBy('nombre', 'asc');
        }])
        ->get();

        // Transformar para incluir urls de imágenes y slugs que son attributos virtuales
        // Aunque al usar toArray() Laravel debería incluirlos si están en $appends
        
        return response()->json($categorias);
    }
    /**
     * Obtener datos para la vista de cotización (Grid + Form Filters)
     */
    public function quoteData()
    {
        // 1. Obtener Tipos de Máquina desde la tabla 'listas' y agruparlos por Categoría (basado en prefijo de foto)
        $listas = \App\Models\Lista::where('tipo', 'Tipo de Máquina')->get();
        
        $categoriesMap = [];
        $prefixMap = [
            'Const' => ['slug' => 'construccion', 'nombre' => 'Construcción'],
            'EqLig' => ['slug' => 'equipo-ligero', 'nombre' => 'Equipo Ligero'],
            'Miner' => ['slug' => 'mineria', 'nombre' => 'Minería'],
            'Pavim' => ['slug' => 'pavimentacion', 'nombre' => 'Pavimentación'],
            'Tunel' => ['slug' => 'subterraneo', 'nombre' => 'Subterráneo'],
            'Util'  => ['slug' => 'utilitarios', 'nombre' => 'Utilitarios'],
        ];

        foreach ($listas as $item) {
            $prefix = 'Otros'; // Default
            
            if ($item->foto) {
                $parts = explode('_', $item->foto);
                if (count($parts) > 0 && isset($prefixMap[$parts[0]])) {
                    $prefix = $parts[0];
                }
            }

            $catInfo = isset($prefixMap[$prefix]) 
                ? $prefixMap[$prefix] 
                : ['slug' => 'otros', 'nombre' => 'Otros'];
            
            $slug = $catInfo['slug'];

            if (!isset($categoriesMap[$slug])) {
                $categoriesMap[$slug] = [
                    'nombre' => $catInfo['nombre'],
                    'slug' => $slug,
                    'subcategorias' => []
                ];
            }

            $categoriesMap[$slug]['subcategorias'][] = [
                'id' => $item->id,
                'nombre' => $item->nombre,
                'descripcion' => $item->definicion,
                'imagen_url' => $item->foto ? asset('storage/Aplicativo/03. Tipos de Maquina/' . $item->foto) : asset('images/no-image.png'),
                'slug' => \Illuminate\Support\Str::slug($item->nombre) // Needed for frontend compatibility
            ];
        }
        
        // Sort subcategories by name
        foreach ($categoriesMap as &$cat) {
            usort($cat['subcategorias'], function($a, $b) {
                return strcmp($a['nombre'], $b['nombre']);
            });
        }
        
        // Sort categories by slug (or fixed order?)
        // Let's keep specific order if possible.
        $orderedCategories = [];
        $desiredOrder = ['construccion', 'equipo-ligero', 'mineria', 'pavimentacion', 'subterraneo', 'utilitarios', 'otros'];
        
        foreach ($desiredOrder as $slug) {
            if (isset($categoriesMap[$slug])) {
                $orderedCategories[] = $categoriesMap[$slug];
            }
        }

        // 2. Fabricantes para el Formulario
        $brands = \App\Models\Fabricante::orderBy('nombre')->get(['id', 'nombre']);

        // 3. Sistemas para el Formulario
        $systems = \App\Models\Sistema::orderBy('nombre')->get(['id', 'nombre']);
        
        // 4. Modelos (Distintos modelos de la tabla Maquinas)
        $models = \App\Models\Maquina::select('modelo')
            ->whereNotNull('modelo')
            ->distinct()
            ->orderBy('modelo')
            ->pluck('modelo');
            
        return response()->json([
            'categories' => $orderedCategories,
            'brands' => $brands,
            'systems' => $systems,
            'models' => $models
        ]);
    }

    /**
     * Actualizar una categoría de landing (Admin)
     */
    public function updateCategoria(Request $request, CategoriaLanding $categoria)
    {
        $validated = $request->validate([
            'nombre' => 'sometimes|string|max:255',
            'descripcion_general' => 'nullable|string',
            'mostrar_en_navbar' => 'sometimes|boolean',
            'orden_navbar' => 'nullable|integer'
        ]);

        $categoria->update($validated);

        return response()->json($categoria);
    }
    
    /**
     * Actualizar una subcategoría de landing (Admin)
     */
    public function updateSubcategoria(Request $request, \App\Models\SubcategoriaLanding $subcategoria)
    {
        $validated = $request->validate([
            'mostrar_en_navbar' => 'sometimes|boolean',
            'orden_navbar' => 'nullable|integer'
        ]);

        $subcategoria->update($validated);

        return response()->json($subcategoria);
    }
}
