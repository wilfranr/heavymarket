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
            ->with(['children' => function ($q) {
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
        $categorias = CategoriaLanding::where('estado', true)
            ->with(['subcategorias' => function ($query) {
                $query->where('estado', true)->orderBy('nombre', 'asc');
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
            ->where('estado', true)
            ->orderBy('updated_at', 'desc')
            ->with(['subcategorias' => function ($query) {
                $query->where('mostrar_en_navbar', true)
                    ->where('estado', true)
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
        $brands = \App\Models\Lista::where('tipo', 'Fabricantes')
            ->orderBy('nombre')
            ->get();

        return response()->json($brands);
    }

    public function quoteData()
    {
        // 1. Obtener Categorías de Máquina y sus Tipos desde la DB
        $categoriesData = \App\Models\Lista::where('tipo', 'Categoría de Máquina')
            ->with(['children' => function ($q) {
                $q->where('tipo', 'Tipo de Máquina')->orderBy('nombre');
            }])
            ->get();

        $categoriesMap = [];
        foreach ($categoriesData as $cat) {
            $slug = \Illuminate\Support\Str::slug($cat->nombre);
            $subcategorias = [];

            foreach ($cat->children->transform(function ($item) {
                $imageUrl = null;
                $rawFoto = $item->getRawOriginal('foto');
                
                if ($rawFoto) {
                    if (str_starts_with($rawFoto, 'http')) {
                        $imageUrl = $rawFoto;
                    } elseif (str_contains($rawFoto, '/')) {
                        $imageUrl = asset('storage/'.$rawFoto);
                    } else {
                        // Lógica para rutas legadas en Tipos de Máquina
                        $oldPath = 'Aplicativo/03. Tipos de Maquina/'.$rawFoto;
                        if (file_exists(storage_path('app/public/'.$oldPath))) {
                            $imageUrl = asset('storage/'.$oldPath);
                        }
                    }
                }

                $item->imagen_url = $imageUrl ?? asset('images/no-image.png');

                return $item;
            }) as $item) {
                $subcategorias[] = [
                    'id' => $item->id,
                    'nombre' => $item->nombre,
                    'descripcion' => $item->definicion,
                    'imagen_url' => $item->imagen_url,
                    'slug' => \Illuminate\Support\Str::slug($item->nombre),
                ];
            }

            $categoriesMap[$slug] = [
                'nombre' => $cat->nombre,
                'slug' => $slug,
                'subcategorias' => $subcategorias,
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
            if (! in_array($slug, $desiredOrder)) {
                $orderedCategories[] = $data;
            }
        }

        // 2. Fabricantes para el Formulario
        $brands = \App\Models\Lista::where('tipo', 'Fabricantes')
            ->orderBy('nombre')
            ->get();

        // 3. Sistemas para el Formulario (que incluyen listas de Tipo de Artículo)
        $allItemTypes = \App\Models\Lista::where('tipo', 'Tipo de Artículo')
            ->select('id', 'nombre', 'foto')
            ->orderBy('nombre')
            ->get();

        $defaultSystem = \App\Models\Sistema::where('nombre', 'Por Defecto')->first();
        if ($defaultSystem) {
            $defaultSystem->setRelation('listas', $allItemTypes);
        }

        $otherSystems = \App\Models\Sistema::where('nombre', '!=', 'Por Defecto')
            ->with(['listas' => function ($query) {
                $query->where('tipo', 'Tipo de Artículo')
                    ->select('listas.id', 'listas.nombre', 'listas.foto')
                    ->orderBy('listas.nombre');
            }])
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'imagen']);

        $systems = collect();
        if ($defaultSystem) {
            $systems->push($defaultSystem);
        }
        $systems = $systems->concat($otherSystems);

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
            'models' => $models,
        ]);
    }

    /**
     * Procesar una solicitud de cotización desde la landing page
     */
    public function submitQuote(Request $request)
    {
        $validated = $request->validate([
            'userData' => 'nullable|array',
            'userData.name' => 'nullable|string|max:255',
            'userData.email' => 'nullable|email|max:255',
            'userData.phone' => 'nullable|string|max:20',
            'userData.company' => 'nullable|string|max:255',
            'userData.country' => 'nullable',
            'userData.state' => 'nullable',
            'userData.city' => 'nullable',
            'userData.address' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.system' => 'required|string',
            'items.*.description' => 'nullable|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.reference' => 'nullable|string',
            'items.*.comment' => 'nullable|string',
            'items.*.files' => 'nullable|array|max:10',
            'items.*.files.*' => 'image|max:10240', // Máx 10MB por imagen
            'selectedBrand' => 'required|string',
            'selectedType' => 'required|string',
            'selectedModel' => 'required|string',
            'selectedSeries' => 'nullable|string',
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($request) {
            $userData = $request->input('userData') ?? [];
            $authenticatedUser = $request->user(); // Usuario logueado via Sanctum (cliente registrado)

            // 1. Determinar tercero y user_id
            $tercero = null;
            $userId = null;

            if ($authenticatedUser) {
                // Cliente logueado - usar su usuario y tercero existente
                $userId = $authenticatedUser->id;
                $tercero = \App\Models\Tercero::where('user_id', $userId)->first();
            } else {
                // Cliente no logueado - buscar por email
                $email = $userData['email'] ?? null;
                if ($email) {
                    $tercero = \App\Models\Tercero::where('email', $email)->first();
                }
            }

            // Crear tercero si no existe (para clientes no registrados)
            if (! $tercero && $userData['email'] ?? null) {
                $tercero = \App\Models\Tercero::create([
                    'nombre' => $userData['name'] ?? 'Sin nombre',
                    'email' => $userData['email'],
                    'telefono' => $userData['phone'] ?? null,
                    'direccion' => $userData['address'] ?? '-',
                    'country_id' => is_array($userData['country'] ?? null) ? $userData['country']['id'] : ($userData['country'] ?? null),
                    'state_id' => is_array($userData['state'] ?? null) ? $userData['state']['id'] : ($userData['state'] ?? null),
                    'city_id' => is_array($userData['city'] ?? null) ? $userData['city']['id'] : ($userData['city'] ?? null),
                    'tipo' => 'Cliente',
                    'estado' => 'Activo',
                    'tipo_documento' => $userData['documentType'] ?? 'NIT',
                    'numero_documento' => $userData['documentNumber'] ?? '0',
                    'forma_pago' => 'Contado',
                    'puntos' => 0,
                ]);
            }

            // 2. Buscar fabricante si se especificó
            $fabricanteId = null;
            if ($request->filled('selectedBrand')) {
                $brandName = trim($request->input('selectedBrand'));
                $fabricante = \App\Models\Lista::where('tipo', 'Fabricantes')
                    ->whereRaw('LOWER(nombre) = ?', [mb_strtolower($brandName)])
                    ->first();
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
                if (! $maquina) {
                    $maquina = \App\Models\Maquina::whereHas('terceros', function ($q) use ($tercero) {
                        $q->where('tercero_id', $tercero->id);
                    })
                        ->where('tipo', $request->input('selectedType'))
                        ->where('modelo', $request->input('selectedModel') ?? 'Por definir')
                        ->where('serie', $request->input('selectedSeries')) // NULL si no existe
                        ->first();
                }

                // Si no existe, crear una nueva máquina
                if (! $maquina) {
                    $maquina = \App\Models\Maquina::create([
                        'tipo' => $request->input('selectedType'),
                        'modelo' => $request->input('selectedModel') ?? 'Por definir',
                        'serie' => $request->input('selectedSeries'), // NULL si no existe
                        'arreglo' => $request->input('selectedArrangement') ?? 'Por definir',
                        'fabricante_id' => $fabricanteId, // Asignar marca seleccionada o null
                        'estado_revision' => 'por_revisar',
                    ]);

                    // Vincular la máquina al tercero
                    $maquina->terceros()->attach($tercero->id);
                } else {
                    // Asegurar vinculación si se encontró por serie global pero no estaba vinculada
                    if (! $maquina->terceros()->where('tercero_id', $tercero->id)->exists()) {
                        $maquina->terceros()->attach($tercero->id);
                    }
                }

                $maquinaId = $maquina->id;
            }

            // 4. Crear el Pedido
            // Si hay usuario logueado, asignar user_id; si no, pedido sin asignar (para admins/analistas)
            $pedido = \App\Models\Pedido::create([
                'tercero_id' => $tercero?->id,
                'user_id' => $userId, // null si cliente no registrado
                'estado' => 'Nuevo',
                'comentario' => "Cotización Landing: {$request->input('selectedType')} {$request->input('selectedModel')} ".($request->input('selectedSeries') ? 'Series: '.$request->input('selectedSeries') : ''),
                'fabricante_id' => $fabricanteId,
                'maquina_id' => $maquinaId,
                'direccion' => $userData['address'] ?? $tercero?->direccion,
            ]);

            // 5. Procesar Ítems
            $itemsData = $request->input('items');
            \Illuminate\Support\Facades\Log::info('Procesando items cotización:', ['count' => count($itemsData), 'data' => $itemsData]);

            foreach ($itemsData as $index => $itemData) {
                $systemName = trim($itemData['system'] ?? '');
                $sistema = \App\Models\Sistema::whereRaw('LOWER(nombre) = ?', [mb_strtolower($systemName)])->first()
                    ?? \App\Models\Sistema::where('nombre', 'Por Defecto')->first();
                $sistemaId = $sistema?->id;

                // Tipo de artículo = Lista (tipo "Tipo de Artículo") relacionada con este sistema
                $description = trim($itemData['description'] ?? '');
                $lista = null;
                if ($sistemaId && $description !== '') {
                    $lista = \App\Models\Lista::where('tipo', 'Tipo de Artículo')
                        ->whereHas('sistemas', fn ($q) => $q->where('sistemas.id', $sistemaId))
                        ->whereRaw('LOWER(nombre) = ?', [mb_strtolower($description)])
                        ->first();
                }

                // Fallback a "Por Defecto" si no se encuentra el tipo especificado
                if (! $lista) {
                    $lista = \App\Models\Lista::where('tipo', 'Tipo de Artículo')
                        ->whereRaw('LOWER(nombre) = ?', ['por defecto'])
                        ->first();
                }
                $listaId = $lista?->id;

                // Articulo opcional (para Referencia) - por si existe definición coincidente
                $articulo = \App\Models\Articulo::whereRaw('LOWER(definicion) = ?', [mb_strtolower($description)])
                    ->orWhereRaw('LOWER(descripcionEspecifica) = ?', [mb_strtolower($description)])
                    ->first();
                $articuloId = $articulo?->id;

                // Definiciones básicas de ítems
                // Si el frontend ya envió un ID de referencia procesado
                $referenciaId = $itemData['referencia_id'] ?? null;
                $referenceUser = isset($itemData['reference']) ? trim((string) $itemData['reference']) : '';

                if ($referenciaId) {
                    // Si ya existe el ID, aseguramos que tenga la marca de la cotización si es temporal o no tiene marca
                    $referenciaExistente = \App\Models\Referencia::find($referenciaId);
                    if ($referenciaExistente && $fabricanteId) {
                        $updateData = [];
                        if (! $referenciaExistente->marca_id || ($referenciaExistente->es_temporal && $referenciaExistente->marca_id !== $fabricanteId)) {
                            $updateData['marca_id'] = $fabricanteId;
                        }
                        if (! empty($updateData)) {
                            $referenciaExistente->update($updateData);
                        }
                    }
                } else {
                    // Referencia del usuario (código libre); definicion en PedidoReferencia = solo esto
                    $referenceText = $referenceUser !== '' ? $referenceUser : ('Pendiente - '.$description);

                    $referencia = \App\Models\Referencia::where('referencia', $referenceText)->first();

                    if (! $referencia) {
                        $referencia = \App\Models\Referencia::create([
                            'referencia' => strtoupper($referenceText),
                            'articulo_id' => $articuloId,
                            'marca_id' => $fabricanteId,
                            'lista_id' => $listaId, // Nuevo: asociar tipo de artículo
                            'es_temporal' => true, // Siempre temporal si viene de landing
                            'comentario' => 'Referencia manual desde Landing - Requiere revisión',
                        ]);
                    } else {
                        // Si la referencia existe, aseguramos que tenga la marca de la cotización
                        // Especialmente si es temporal o no tiene marca asignada.
                        $updateData = [];
                        if ($articuloId && ! $referencia->articulo_id) {
                            $updateData['articulo_id'] = $articuloId;
                        }

                        // Si no tiene marca, o si es temporal y la marca es distinta, la actualizamos para que coincida con la cotización
                        if ($fabricanteId && (! $referencia->marca_id || ($referencia->es_temporal && $referencia->marca_id !== $fabricanteId))) {
                            $updateData['marca_id'] = $fabricanteId;
                        }

                        // Nuevo: Si es temporal y no tiene lista_id, o es distinto, lo actualizamos
                        if ($listaId && (! $referencia->lista_id || ($referencia->es_temporal && $referencia->lista_id !== $listaId))) {
                            $updateData['lista_id'] = $listaId;
                        }

                        if (! empty($updateData)) {
                            $referencia->update($updateData);
                        }
                    }

                    $referenciaId = $referencia->id;
                }

                // Manejo de múltiples imágenes (files array)
                $imagePaths = [];
                if ($request->hasFile("items.{$index}.files")) {
                    $uploadedFiles = $request->file("items.{$index}.files");
                    foreach ($uploadedFiles as $file) {
                        if ($file && $file->isValid()) {
                            $imagePaths[] = $file->store('pedidos/referencias', 'public');
                        }
                    }
                }

                // Compatibilidad con parámetro legacy 'file' (por si acaso)
                if (empty($imagePaths)) {
                    $legacyFile = $request->file("items.{$index}.file");
                    if ($legacyFile && $legacyFile->isValid()) {
                        $imagePaths[] = $legacyFile->store('pedidos/referencias', 'public');
                    }
                }

                $mainImagePath = ! empty($imagePaths) ? $imagePaths[0] : null;

                $comentarioItem = isset($itemData['comment']) ? trim((string) $itemData['comment']) : '';

                if ($comentarioItem !== '') {
                    $comentariosEstructurados = [
                        [
                            'origen' => 'Cliente',
                            'comentario' => $comentarioItem,
                            'fecha' => now()->toISOString(),
                        ],
                    ];
                    $comentarioPedidoRef = json_encode($comentariosEstructurados, JSON_UNESCAPED_UNICODE);
                } else {
                    $comentarioPedidoRef = 'Sin comentario adicional';
                }

                $pedidoRef = \App\Models\PedidoReferencia::create([
                    'pedido_id' => $pedido->id,
                    'referencia_id' => $referenciaId,
                    'sistema_id' => $sistemaId,
                    'lista_id' => $listaId,
                    'marca_id' => $fabricanteId,
                    'definicion' => $referenceUser,
                    'cantidad' => $itemData['quantity'],
                    'comentario' => $comentarioPedidoRef,
                    'imagen' => $mainImagePath,
                    'estado' => 1,
                    'mostrar_referencia' => 1,
                ]);

                // Registrar TODAS las imágenes en tabla de imágenes por ítem
                foreach ($imagePaths as $path) {
                    \App\Models\PedidoReferenciaImagen::create([
                        'pedido_referencia_id' => $pedidoRef->id,
                        'imagen' => $path,
                        'origen' => \App\Models\PedidoReferenciaImagen::ORIGEN_CLIENTE,
                    ]);
                }
            }

            // 6. Enviar e-mails
            try {
                $pedido->load(['tercero', 'referencias.referencia', 'referencias.sistema']);

                \Illuminate\Support\Facades\Mail::to($tercero->email)
                    ->send(new \App\Mail\QuoteRequestedClient($pedido));

                \Illuminate\Support\Facades\Mail::to('comercial@heavymarket.net')
                    ->send(new \App\Mail\QuoteRequestedAdmin($pedido));
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Error enviando correos de cotización: '.$e->getMessage());
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Tu solicitud de cotización ha sido recibida con éxito.',
                'pedido_id' => $pedido->id,
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
            'estado' => 'nuevo',
        ]);

        try {
            // Send email to commercial team asynchronously (if queue is configured) or synchronously
            \Illuminate\Support\Facades\Mail::to('comercial@heavymarket.net')
                ->send(new \App\Mail\NewContactLead($clienteInteresado));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error enviando correo de nuevo lead de contacto: '.$e->getMessage());
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
            'estado' => 'boolean',
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
            'estado' => 'sometimes|boolean',
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
            'imagen' => 'nullable|image|max:5120',
            'mostrar_en_navbar' => 'boolean',
            'orden_navbar' => 'nullable|integer',
            'estado' => 'boolean',
        ]);

        // Separar datos simples del archivo de imagen
        $data = $validated;
        unset($data['imagen']);

        $subcategoria = new \App\Models\SubcategoriaLanding($data);

        if ($request->hasFile('imagen')) {
            $subcategoria->imagen = $request->file('imagen')->store('landing', 'public');
        }

        $subcategoria->save();

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
            'imagen' => 'nullable|image|max:5120',
            'mostrar_en_navbar' => 'sometimes|boolean',
            'orden_navbar' => 'nullable|integer',
            'estado' => 'sometimes|boolean',
            'remove_imagen' => 'sometimes|boolean',
        ]);

        // Actualizar campos básicos (sin incluir la imagen ni flags especiales)
        $data = $validated;
        unset($data['imagen'], $data['remove_imagen']);

        if (! empty($data)) {
            $subcategoria->update($data);
        }

        // Eliminar imagen existente si se solicita explícitamente
        if ($request->boolean('remove_imagen')) {
            $subcategoria->imagen = null;
        }

        // Guardar nueva imagen si se envía un archivo
        if ($request->hasFile('imagen')) {
            $subcategoria->imagen = $request->file('imagen')->store('landing', 'public');
        }

        if ($subcategoria->isDirty()) {
            $subcategoria->save();
        }

        return response()->json($subcategoria);
    }

    /**
     * Obtener listado de clientes interesados (leads de contacto)
     */
    public function contactLeads()
    {
        $terceroEmails = \App\Models\Tercero::whereNotNull('email')->pluck('email')->toArray();
        $leads = \App\Models\ClienteInteresado::whereNotIn('correo_electronico', $terceroEmails)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($leads);
    }

    /**
     * Actualizar estado de un lead de contacto
     */
    public function updateContactLeadStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'estado' => 'required|string|in:nuevo,contactado,descartado',
        ]);

        $lead = \App\Models\ClienteInteresado::findOrFail($id);
        $lead->update(['estado' => $validated['estado']]);

        return response()->json([
            'status' => 'success',
            'message' => 'Estado actualizado correctamente',
            'data' => $lead,
        ]);
    }
}
