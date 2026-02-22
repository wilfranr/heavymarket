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
            $query->orderBy('updated_at', 'desc')->orderBy('nombre', 'asc');
        }])
        ->orderBy('updated_at', 'desc')
        ->orderBy('nombre', 'asc')
        ->get();
    }

    /**
     * Obtener tipos de máquina jerarquizados para administración
     */
    public function machineTypesAdmin()
    {
        return \App\Models\Lista::where('tipo', 'Categoría de Máquina')
            ->with(['children' => function($q) {
                $q->where('tipo', 'Tipo de Máquina')->orderBy('nombre');
            }])
            ->orderBy('nombre')
            ->get();
    }

    /**
     * Obtener categorías de la landing con sus subcategorías.
     * Este endpoint se usa para la sección "Nuestros Productos" (muestra todas)
     */
    public function index()
    {
        $categorias = CategoriaLanding::with(['subcategorias' => function ($query) {
            $query->orderBy('nombre', 'asc');
        }])
        ->orderBy('nombre', 'asc')
        ->get();

        return response()->json($categorias);
    }

    /**
     * Obtener categorías y subcategorías filtradas para el mega menú del navbar
     * Solo devuelve las marcadas como mostrar_en_navbar = true
     */
    public function navbarData()
    {
        $categorias = CategoriaLanding::where('mostrar_en_navbar', true)
        ->orderBy('updated_at', 'desc')
        ->with(['subcategorias' => function ($query) {
            $query->where('mostrar_en_navbar', true)
                  ->orderBy('updated_at', 'desc')
                  ->orderBy('nombre', 'asc');
        }])
        ->get();

        return response()->json($categorias);
    }
    
    /**
     * Obtener marcas para el carrusel de la landing
     */
    public function brands()
    {
        $brands = \App\Models\Fabricante::orderBy('nombre')
            ->get();
            
        return response()->json($brands);
    }
    public function quoteData()
    {
        // 1. Obtener Categorías de Máquina y sus Tipos desde la DB
        $categoriesData = \App\Models\Lista::where('tipo', 'Categoría de Máquina')
            ->with(['children' => function($q) {
                $q->where('tipo', 'Tipo de Máquina')->orderBy('nombre');
            }])
            ->get();
        
        $categoriesMap = [];
        foreach ($categoriesData as $cat) {
            $slug = \Illuminate\Support\Str::slug($cat->nombre);
            $subcategorias = [];

            foreach ($cat->children as $item) {
                $imageUrl = asset('images/no-image.png');
                $rawFoto = $item->getRawOriginal('foto');
                if ($rawFoto) {
                    if (str_starts_with($rawFoto, 'http')) {
                         $imageUrl = $rawFoto;
                    } elseif (str_contains($rawFoto, '/')) {
                        $imageUrl = asset('storage/' . $rawFoto);
                    } else {
                        $oldPath = 'Aplicativo/03. Tipos de Maquina/' . $rawFoto;
                        if (file_exists(storage_path('app/public/' . $oldPath))) {
                            $imageUrl = asset('storage/' . $oldPath);
                        }
                    }
                }

                $subcategorias[] = [
                    'id' => $item->id,
                    'nombre' => $item->nombre,
                    'descripcion' => $item->definicion,
                    'imagen_url' => $imageUrl,
                    'slug' => \Illuminate\Support\Str::slug($item->nombre)
                ];
            }

            $categoriesMap[$slug] = [
                'nombre' => $cat->nombre,
                'slug' => $slug,
                'subcategorias' => $subcategorias
            ];
        }
        
        // Mantener orden específico deseado
        $orderedCategories = [];
        $desiredOrder = ['construccion', 'equipo-ligero', 'mineria', 'pavimentacion', 'subterraneo', 'utilitarios', 'otros'];
        
        foreach ($desiredOrder as $slug) {
            if (isset($categoriesMap[$slug])) {
                $orderedCategories[] = $categoriesMap[$slug];
            }
        }

        // Agregar cualquier categoría extra que no esté en el orden deseado
        foreach ($categoriesMap as $slug => $data) {
            if (!in_array($slug, $desiredOrder)) {
                $orderedCategories[] = $data;
            }
        }

        // 2. Fabricantes para el Formulario
        $brands = \App\Models\Fabricante::orderBy('nombre')->get(['id', 'nombre']);

        // 3. Sistemas para el Formulario (que incluyen listas de Tipo de Artículo)
        $systems = \App\Models\Sistema::with(['listas' => function ($query) {
            $query->where('tipo', 'Tipo de Artículo')->select('listas.id', 'listas.nombre')->orderBy('listas.nombre');
        }])->orderBy('nombre')->get(['id', 'nombre']);
        
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
     * Procesar una solicitud de cotización desde la landing page
     */
    public function submitQuote(Request $request)
    {
        $validated = $request->validate([
            'userData' => 'required|array',
            'userData.name' => 'required|string|max:255',
            'userData.email' => 'required|email|max:255',
            'userData.phone' => 'required|string|max:20',
            'userData.company' => 'nullable|string|max:255',
            'userData.country' => 'nullable',
            'userData.state' => 'nullable',
            'userData.city' => 'nullable',
            'userData.address' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.system' => 'required|string',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.reference' => 'nullable|string',
            'selectedBrand' => 'nullable|string',
            'selectedType' => 'nullable|string',
            'selectedModel' => 'nullable|string',
            'selectedSeries' => 'nullable|string',
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($request) {
            $userData = $request->input('userData');
            
            // 1. Buscar o Crear Tercero por email
            $tercero = \App\Models\Tercero::where('email', $userData['email'])->first();
            
            if (!$tercero) {
                $tercero = \App\Models\Tercero::create([
                    'nombre' => $userData['name'],
                    'email' => $userData['email'],
                    'telefono' => $userData['phone'],
                    'direccion' => $userData['address'] ?? '-',
                    'country_id' => is_array($userData['country']) ? $userData['country']['id'] : $userData['country'],
                    'state_id' => is_array($userData['state']) ? $userData['state']['id'] : $userData['state'],
                    'city_id' => is_array($userData['city']) ? $userData['city']['id'] : $userData['city'],
                    'tipo' => 'Cliente',
                    'estado' => 'Activo',
                    'tipo_documento' => $userData['documentType'] ?? 'NIT', 
                    'numero_documento' => $userData['documentNumber'] ?? '0',
                    'forma_pago' => 'Contado',
                    'puntos' => 0
                ]);
            }

            // 2. Buscar fabricante si se especificó
            $fabricanteId = null;
            if ($request->filled('selectedBrand')) {
                $fabricante = \App\Models\Fabricante::where('nombre', $request->input('selectedBrand'))->first();
                $fabricanteId = $fabricante?->id;
            }

            // 3. Crear o buscar la Máquina
            // 3. Crear o buscar la Máquina
            $maquinaId = null;
            // Si al menos se seleccionó el tipo de máquina, procedemos
            if ($request->filled('selectedType')) {
                $maquina = null;
                
                // Intento 1: Buscar por serie si se proporcionó una
                if ($request->filled('selectedSeries')) {
                    $maquina = \App\Models\Maquina::where('serie', $request->input('selectedSeries'))->first();
                }

                // Intento 2: Si no hay serie, buscar una máquina idéntica ya asociada a este cliente
                // Esto evita crear duplicados de máquinas "Por definir" para el mismo cliente
                if (!$maquina) {
                    $maquina = \App\Models\Maquina::whereHas('terceros', function($q) use ($tercero) {
                        $q->where('tercero_id', $tercero->id);
                    })
                    ->where('tipo', $request->input('selectedType'))
                    ->where('modelo', $request->input('selectedModel') ?? 'Por definir')
                    ->where('serie', $request->input('selectedSeries')) // NULL si no existe
                    ->first();
                }

                // Si no existe, crear una nueva máquina
                if (!$maquina) {
                    $maquina = \App\Models\Maquina::create([
                        'tipo' => $request->input('selectedType'),
                        'modelo' => $request->input('selectedModel') ?? 'Por definir',
                        'serie' => $request->input('selectedSeries'), // NULL si no existe
                        'arreglo' => $request->input('selectedArrangement') ?? 'Por definir',
                        'fabricante_id' => $fabricanteId ?? 1, // Default si no hay fabricante
                    ]);

                    // Vincular la máquina al tercero
                    $maquina->terceros()->attach($tercero->id);
                } else {
                    // Asegurar vinculación si se encontró por serie global pero no estaba vinculada
                    if (!$maquina->terceros()->where('tercero_id', $tercero->id)->exists()) {
                        $maquina->terceros()->attach($tercero->id);
                    }
                }

                $maquinaId = $maquina->id;
            }

            // 4. Crear el Pedido
            $pedido = \App\Models\Pedido::create([
                'tercero_id' => $tercero->id,
                'user_id' => 1, 
                'estado' => 'Nuevo',
                'comentario' => "Cotización Landing: {$request->input('selectedType')} {$request->input('selectedModel')} " . ($request->input('selectedSeries') ? "Series: " . $request->input('selectedSeries') : ""),
                'fabricante_id' => $fabricanteId,
                'maquina_id' => $maquinaId,
                'direccion' => $userData['address'] ?? $tercero->direccion,
            ]);

            // 5. Procesar Ítems
            $itemsData = $request->input('items');
            \Illuminate\Support\Facades\Log::info('Procesando items cotización:', ['count' => count($itemsData), 'data' => $itemsData]);
            
            foreach ($itemsData as $index => $itemData) {
                $sistema = \App\Models\Sistema::where('nombre', $itemData['system'])->first();
                
                // Crear una referencia temporal si se proporcionó un código
                $referenciaId = null;
                if (!empty($itemData['reference'])) {
                    // Buscar si ya existe una referencia con ese código
                    $referencia = \App\Models\Referencia::where('referencia', $itemData['reference'])->first();
                    
                    if (!$referencia) {
                        // Crear referencia temporal para que el analista la complete después
                        $referencia = \App\Models\Referencia::create([
                            'referencia' => $itemData['reference'],
                            'marca_id' => $fabricanteId,
                            'comentario' => "Referencia temporal desde Landing - Requiere revisión del analista de partes"
                        ]);
                    }
                    
                    $referenciaId = $referencia->id;
                }
                
                $imagePath = null;
                // Manejar archivos si vienen en el request (multipart)
                if ($request->hasFile("items.{$index}.file")) {
                    $file = $request->file("items.{$index}.file");
                    $imagePath = $file->store('pedidos/referencias', 'public');
                }

                \App\Models\PedidoReferencia::create([
                    'pedido_id' => $pedido->id,
                    'referencia_id' => $referenciaId,
                    'sistema_id' => $sistema?->id,
                    'marca_id' => $fabricanteId,
                    'definicion' => $itemData['description'],
                    'cantidad' => $itemData['quantity'],
                    'comentario' => $itemData['reference'] 
                        ? "REF/P/N: {$itemData['reference']}" 
                        : "Sin referencia proporcionada",
                    'imagen' => $imagePath,
                    'estado' => 1,
                    'mostrar_referencia' => 1
                ]);
            }

            // 6. Enviar e-mails (Desabilitado temporalmente a petición del usuario)
            /*
            try {
                \Illuminate\Support\Facades\Mail::to($tercero->email)
                    ->send(new \App\Mail\QuoteRequestedClient($pedido));
                
                \Illuminate\Support\Facades\Mail::to('comercial@heavymarket.net')
                    ->send(new \App\Mail\QuoteRequestedAdmin($pedido));
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Error enviando correos de cotización: " . $e->getMessage());
            }
            */

            return response()->json([
                'status' => 'success',
                'message' => 'Tu solicitud de cotización ha sido recibida con éxito.',
                'pedido_id' => $pedido->id
            ]);
        });
    }

    /**
     * Procesar el formulario de contacto de la landing page
     */
    public function submitContactForm(Request $request)
    {
        $validated = $request->validate([
            'nombre_completo' => 'required|string|max:255',
            'empresa' => 'nullable|string|max:255',
            'correo_electronico' => 'required|email|max:255',
            'telefono' => 'nullable|string|max:50',
            'motivo_consulta' => 'required|string',
            'acepta_tratamiento_datos' => 'required|accepted',
        ]);

        $clienteInteresado = \App\Models\ClienteInteresado::create([
            ...$validated,
            'acepta_tratamiento_datos' => true,
            'estado' => 'nuevo'
        ]);

        try {
            // Send email to commercial team asynchronously (if queue is configured) or synchronously
            \Illuminate\Support\Facades\Mail::to('comercial@heavymarket.net')
                ->send(new \App\Mail\NewContactLead($clienteInteresado));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Error enviando correo de nuevo lead de contacto: " . $e->getMessage());
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Tu mensaje ha sido enviado con éxito.',
        ]);
    }

    /**
     * Actualizar una categoría de landing (Admin)
     */
    public function storeCategoria(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion_general' => 'nullable|string',
            'mostrar_en_navbar' => 'boolean',
            'orden_navbar' => 'nullable|integer',
            'estado' => 'boolean'
        ]);

        $categoria = CategoriaLanding::create($validated);
        $categoria->load('subcategorias');

        return response()->json($categoria, 201);
    }

    public function destroyCategoria(CategoriaLanding $categoria)
    {
        $categoria->delete();
        return response()->json(['message' => 'Categoría eliminada']);
    }

    public function updateCategoria(Request $request, CategoriaLanding $categoria)
    {
        $validated = $request->validate([
            'nombre' => 'sometimes|string|max:255',
            'descripcion_general' => 'nullable|string',
            'mostrar_en_navbar' => 'sometimes|boolean',
            'orden_navbar' => 'nullable|integer',
            'estado' => 'sometimes|boolean'
        ]);

        $categoria->update($validated);
        $categoria->load('subcategorias');

        return response()->json($categoria);
    }
    
    public function storeSubcategoria(Request $request)
    {
        $validated = $request->validate([
            'categoria_id' => 'required|exists:categorias_landing,id',
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'mostrar_en_navbar' => 'boolean',
            'orden_navbar' => 'nullable|integer',
            'estado' => 'boolean'
        ]);

        $subcategoria = \App\Models\SubcategoriaLanding::create($validated);

        return response()->json($subcategoria, 201);
    }

    public function destroySubcategoria(\App\Models\SubcategoriaLanding $subcategoria)
    {
        $subcategoria->delete();
        return response()->json(['message' => 'Subcategoría eliminada']);
    }

    public function updateSubcategoria(Request $request, \App\Models\SubcategoriaLanding $subcategoria)
    {
        $validated = $request->validate([
            'nombre' => 'sometimes|string|max:255',
            'descripcion' => 'nullable|string',
            'mostrar_en_navbar' => 'sometimes|boolean',
            'orden_navbar' => 'nullable|integer',
            'estado' => 'sometimes|boolean'
        ]);

        $subcategoria->update($validated);

        return response()->json($subcategoria);
    }

    /**
     * Obtener listado de clientes interesados (leads de contacto)
     */
    public function contactLeads()
    {
        $leads = \App\Models\ClienteInteresado::orderBy('created_at', 'desc')->get();
        return response()->json($leads);
    }

    /**
     * Actualizar estado de un lead de contacto
     */
    public function updateContactLeadStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'estado' => 'required|string|in:nuevo,contactado,descartado'
        ]);

        $lead = \App\Models\ClienteInteresado::findOrFail($id);
        $lead->update(['estado' => $validated['estado']]);

        return response()->json([
            'status' => 'success',
            'message' => 'Estado actualizado correctamente',
            'data' => $lead
        ]);
    }
}
