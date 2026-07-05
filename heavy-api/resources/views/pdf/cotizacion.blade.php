<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Cotización COT-{{ $cotizacion->id }}</title>
    <style>
        @page {
            margin: 1.2cm 1cm 1cm 1cm;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            color: #1e293b;
            font-size: 9px;
            line-height: 1.3;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        /* Header */
        .header-table {
            width: 100%;
            margin-bottom: 20px;
        }
        .header-table td {
            vertical-align: top;
        }
        .header-table td.meta-container {
            vertical-align: top;
        }
        .logo-container {
            width: 140px;
            text-align: left;
        }
        .logo {
            max-width: 140px;
            max-height: 70px;
            object-fit: contain;
        }
        .company-info-container {
            text-align: left;
            padding-left: 8px;
            font-size: 8.5px;
            color: #475569;
            line-height: 1.4;
        }
        .company-name {
            font-size: 13px;
            font-weight: bold;
            color: #0f172a;
            margin: 0 0 4px 0;
            text-align: left;
        }
        .meta-container {
            width: 140px;
            padding: 0;
        }
        .meta-table {
            width: 100%;
            height: 82px;
            border-collapse: collapse;
        }
        .meta-spacer {
            height: 68px;
            padding: 0;
            margin: 0;
            font-size: 1px;
            line-height: 1px;
        }
        .meta-date {
            text-align: right;
            vertical-align: bottom;
            font-size: 8.5px;
            color: #475569;
            padding: 0;
            white-space: nowrap;
        }

        /* Bloque Cliente y Título */
        .client-section {
            width: 100%;
            margin-bottom: 15px;
        }
        .client-section td {
            vertical-align: top;
        }
        .client-title {
            font-size: 11px;
            font-weight: bold;
            color: #475569;
            margin-bottom: 5px;
            text-transform: uppercase;
        }
        .client-name {
            font-size: 11px;
            font-weight: bold;
            color: #0f172a;
            margin: 0 0 3px 0;
        }
        .client-info {
            font-size: 9px;
            color: #334155;
            line-height: 1.3;
        }
        .doc-title-container {
            text-align: right;
        }
        .doc-title {
            font-size: 18px;
            font-weight: bold;
            color: #0f172a;
            margin: 0;
            text-transform: uppercase;
        }
        .doc-number {
            font-size: 10px;
            color: #475569;
            margin-top: 2px;
        }

        /* Informaciones Adicionales */
        .info-title {
            font-size: 11px;
            font-weight: bold;
            color: #475569;
            margin-bottom: 5px;
            text-transform: uppercase;
        }
        .info-table {
            width: 100%;
            border-top: 1px solid #cbd5e1;
            border-bottom: 1px solid #cbd5e1;
            margin-bottom: 20px;
            font-size: 9px;
        }
        .info-table td {
            padding: 4px 0;
            vertical-align: top;
        }
        .info-label {
            font-weight: bold;
            color: #334155;
            width: 18%;
        }
        .info-value {
            color: #0f172a;
            width: 32%;
        }

        /* Tabla de Productos */
        .badge-container {
            margin-bottom: -1px;
        }
        .products-badge {
            background-color: #f5b041;
            color: white;
            display: inline-block;
            padding: 3px 12px;
            font-weight: bold;
            font-size: 8.5px;
            border-top-left-radius: 4px;
            border-top-right-radius: 4px;
            text-transform: uppercase;
        }
        .products-table {
            width: 100%;
            border: 1px solid #cbd5e1;
            font-size: 9px;
        }
        .products-table th {
            background-color: #f5b041;
            color: white;
            padding: 6px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 8px;
            border: 1px solid #cbd5e1;
            text-align: center;
        }
        .products-table td {
            padding: 5px 6px;
            border: 1px solid #cbd5e1;
            vertical-align: middle;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-left { text-align: left; }

        /* Totales */
        .totals-wrapper {
            width: 100%;
            margin-top: 10px;
        }
        .totals-table {
            width: 250px;
            float: right;
            font-size: 9.5px;
        }
        .totals-table td {
            padding: 4px 0;
        }
        .totals-label {
            text-align: left;
            font-weight: bold;
            color: #334155;
        }
        .totals-value {
            text-align: right;
            color: #0f172a;
        }
        .total-row td {
            border-top: 1px solid #475569;
            padding-top: 6px;
            font-weight: bold;
            font-size: 11px;
        }
        .double-border-row td {
            border-top: 1px dashed #94a3b8;
            height: 1px;
            padding: 0;
        }

        /* Observaciones y Términos */
        .bottom-section {
            clear: both;
            margin-top: 25px;
        }
        .notes-title {
            font-size: 11px;
            font-weight: bold;
            color: #475569;
            margin-bottom: 4px;
            text-transform: uppercase;
        }
        .notes-content {
            font-size: 9px;
            color: #334155;
            line-height: 1.3;
            text-align: justify;
            margin: 0 0 15px 0;
        }
        .legal-text {
            font-size: 7.5px;
            color: #64748b;
            text-align: justify;
            line-height: 1.3;
            border-top: 1px solid #e2e8f0;
            padding-top: 6px;
        }
    </style>
</head>
<body>

    @php
        // Resolver ruta del logo
        $logoPath = null;
        if (file_exists(public_path('images/logo-pdf.png'))) {
            $logoPath = public_path('images/logo-pdf.png');
        } elseif (isset($empresa->logo_dark) && file_exists(public_path('storage/' . $empresa->logo_dark))) {
            $logoPath = public_path('storage/' . $empresa->logo_dark);
        } elseif (isset($empresa->logo_light) && file_exists(public_path('storage/' . $empresa->logo_light))) {
            $logoPath = public_path('storage/' . $empresa->logo_light);
        } elseif (file_exists(public_path('images/logo.png'))) {
            $logoPath = public_path('images/logo.png');
        }
    @endphp

    <!-- Encabezado -->
    <table class="header-table">
        <tr>
            <!-- Logo -->
            <td class="logo-container" style="vertical-align: top;">
                @if($logoPath)
                    <img src="{{ $logoPath }}" class="logo">
                @else
                    <div style="background: #e2e8f0; color: #475569; padding: 10px; font-weight: bold; text-align: center; border-radius: 4px; font-size: 11px;">HEAVYMARKET</div>
                @endif
            </td>
            <!-- Información de la Empresa -->
            <td class="company-info-container" style="vertical-align: top;">
                <h1 class="company-name">{{ $empresa?->nombre ?? 'Heavymarket S.A.S.' }}</h1>
                Nit. {{ $empresa?->nit ?? '901.881.206-8' }}<br>
                Dirección: {{ $empresa?->direccion ?? 'Carrera 79 C No. 40 A – 72 sur – Bogotá, Colombia' }}<br>
                TEL: {{ $empresa?->telefono ?? '320 840 0279' }}<br>
                Correo: {{ $empresa?->email ?? 'comercial@heavymarket.net' }}<br>
                Sitio web: {{ $empresa?->web ?? 'www.heavymarket.net' }}
            </td>
            <!-- Metadatos: fecha al pie del bloque (página vía script DomPDF arriba) -->
            <td class="meta-container">
                <table class="meta-table">
                    <tr>
                        <td class="meta-spacer">&nbsp;</td>
                    </tr>
                    <tr>
                        <td class="meta-date">
                            Fecha: {{ $cotizacion->fecha_emision?->format('d/m/Y') ?? now()->format('d/m/Y') }}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <!-- Bloque de Cliente y Título de Cotización -->
    <table class="client-section">
        <tr>
            <!-- Datos del Cliente -->
            <td>
                <div class="client-title">Datos del cliente:</div>
                <h2 class="client-name">{{ strtoupper($cotizacion->tercero?->razon_social ?? $cotizacion->tercero?->nombre ?? 'N/A') }}</h2>
                <div class="client-info">
                    <strong>Dirección:</strong> {{ strtoupper($cotizacion->tercero?->direccion ?? 'N/A') }}<br>
                    <strong>Teléfono:</strong> {{ $cotizacion->tercero?->telefono ?? $cotizacion->tercero?->celular ?? 'N/A' }}<br>
                    <strong>Email:</strong> {{ strtolower($cotizacion->tercero?->email ?? 'N/A') }}
                </div>
            </td>
            <!-- Título del Documento -->
            <td class="doc-title-container" style="width: 30%;">
                <h1 class="doc-title">Cotización</h1>
                <div class="doc-number">No. {{ $cotizacion->id }}</div>
            </td>
        </tr>
    </table>

    <!-- Informaciones Adicionales -->
    <div class="info-title">Informaciones adicionales</div>
    <table class="info-table">
        <tr>
            <td class="info-label">Vendedor</td>
            <td class="info-value">: {{ $cotizacion->user?->name ?? 'N/A' }}</td>
            <td class="info-label">Máquina</td>
            <td class="info-value">: {{ strtoupper($cotizacion->pedido?->maquina?->tipo ?? 'N/A') }}</td>
        </tr>
        <tr>
            <td class="info-label">Teléfono Vendedor</td>
            <td class="info-value">: {{ $cotizacion->user?->tercero?->celular ?? $cotizacion->user?->tercero?->telefono ?? '320 840 0279' }}</td>
            <td class="info-label">Fabricante</td>
            <td class="info-value">: {{ strtoupper($cotizacion->pedido?->maquina?->fabricante?->nombre ?? 'N/A') }}</td>
        </tr>
        <tr>
            <td class="info-label">Período de validez</td>
            <td class="info-value">: {{ $cotizacion->fecha_emision?->format('d/m/Y') ?? now()->format('d/m/Y') }} al {{ $cotizacion->fecha_vencimiento?->format('d/m/Y') ?? now()->addDays(15)->format('d/m/Y') }}</td>
            <td class="info-label">Modelo</td>
            <td class="info-value">: {{ strtoupper($cotizacion->pedido?->maquina?->modelo ?? 'N/A') }}</td>
        </tr>
        <tr>
            <td class="info-label">Condición de pago</td>
            <td class="info-value">: Contado</td>
            <td class="info-label">Serie</td>
            <td class="info-value">: {{ strtoupper($cotizacion->pedido?->maquina?->serie ?? 'N/A') }}</td>
        </tr>
    </table>

    <!-- Tabla de Productos -->
    <div class="badge-container">
        <div class="products-badge">Productos</div>
    </div>
    <table class="products-table">
        <thead>
            <tr>
                <th style="width: 50px;">FOTO</th>
                <th style="width: 40px;">CANT</th>
                <th style="width: 80px;">REF</th>
                <th>Descripción</th>
                <th style="width: 80px;">Marca</th>
                <th style="width: 85px;">Entrega</th>
                <th style="width: 80px;">Venta</th>
                <th style="width: 90px;">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($cotizacion->referenciasProveedores as $index => $item)
                @php
                    $prp = $item->pedidoReferenciaProveedor;
                    $imagePath = null;
                    $articulo = $prp?->pedidoReferencia?->referencia?->articulo
                        ?? $prp?->referencia?->articulo;

                    if ($articulo) {
                        $rawFoto = $articulo->getRawOriginal('fotoDescriptiva');
                        if ($rawFoto && ! filter_var($rawFoto, FILTER_VALIDATE_URL)) {
                            $testPath = public_path('storage/' . ltrim($rawFoto, '/'));
                            if (file_exists($testPath)) {
                                $imagePath = $testPath;
                            }
                        }
                    }
                @endphp
                <tr>
                    <td class="text-center" style="padding: 3px;">
                        @if($imagePath)
                            <img src="{{ $imagePath }}" style="max-height: 40px; max-width: 40px; object-fit: contain; display: block; margin: 0 auto;">
                        @else
                            <div style="font-size: 7px; color: #94a3b8;">Sin Foto</div>
                        @endif
                    </td>
                    <td class="text-center">
                        {{ $prp?->cantidad ?? 1 }}
                    </td>
                    <td class="text-center">
                        @if($item->mostrar_referencia)
                            {{ $prp?->referencia?->referencia ?? 'N/A' }}
                        @else
                            N/A
                        @endif
                    </td>
                    <td class="text-left">
                        {{ strtoupper($prp?->pedidoReferencia?->referencia?->articulo?->definicion ?? 'REPUESTO') }}
                    </td>
                    <td class="text-center">
                        {{ strtoupper($prp?->marca?->nombre ?? 'N/A') }}
                    </td>
                    <td class="text-center">
                        {{ strtoupper($prp?->entrega_label ?? 'SIN DEFINIR') }}
                    </td>
                    <td class="text-right">
                        {{ number_format($prp?->valor_unidad ?? 0, 0, ',', '.') }}
                    </td>
                    <td class="text-right">
                        {{ number_format($prp?->valor_total ?? 0, 0, ',', '.') }}
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Totales -->
    <div class="totals-wrapper">
        <table class="totals-table">
            <tr>
                <td class="totals-label">Subtotal:</td>
                <td class="totals-value">COP {{ number_format($cotizacion->total ?? 0, 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td class="totals-label">IVA 19%:</td>
                <td class="totals-value">COP {{ number_format(($cotizacion->total ?? 0) * 0.19, 0, ',', '.') }}</td>
            </tr>
            <tr class="total-row">
                <td class="totals-label">Total a Pagar:</td>
                <td class="totals-value">COP {{ number_format(($cotizacion->total ?? 0) * 1.19, 0, ',', '.') }}</td>
            </tr>
            <tr class="double-border-row">
                <td colspan="2"></td>
            </tr>
        </table>
        <div style="clear: both;"></div>
    </div>

    <!-- Sección Inferior -->
    <div class="bottom-section">
        @php
            $obsText = '';
            if (!empty($cotizacion->observaciones)) {
                $obsText = $cotizacion->observaciones;
            } elseif (!empty($cotizacion->pedido?->comentario)) {
                $comentarioRaw = $cotizacion->pedido->comentario;
                if (is_array($comentarioRaw)) {
                    $comentariosArr = [];
                    foreach ($comentarioRaw as $c) {
                        if (isset($c['comentario'])) {
                            $comentariosArr[] = $c['comentario'];
                        }
                    }
                    $obsText = implode(', ', $comentariosArr);
                } else {
                    $obsText = $comentarioRaw;
                }
            }
        @endphp

        @if(!empty($obsText))
            <div class="notes-title">Observaciones</div>
            <p class="notes-content">{!! nl2br(e($obsText)) !!}</p>
        @endif

        <!-- Condiciones -->
        <div class="notes-title">Condiciones</div>
        <p class="notes-content" style="font-weight: bold; line-height: 1.4; margin-bottom: 20px;">
            CONSIGNAR A NOMBRE DE HEAVYMARKET S.A.S.<br>
            CUENTA DE AHORROS NO. 04500009644 DE BANCOLOMBIA
        </p>

        <!-- Texto Legal -->
        <div class="legal-text">
            <div style="font-weight: bold; font-size: 8.5px; margin-bottom: 6px; text-transform: uppercase; color: #1e293b;">Condiciones Comerciales</div>
            <strong>Validez y Disponibilidad:</strong> Esta cotización es válida hasta la fecha indicada en el campo "Validez" y está sujeta a venta previa. Los precios corresponden a entrega en la ciudad de Bogotá.<br><br>
            <strong>Envíos Nacionales:</strong> Para entregas en otras ciudades, la mercancía se enviará por transportadora con flete a cargo del comprador, bajo la modalidad y empresa que este disponga.<br><br>
            <strong>Garantías y Responsabilidad:</strong> La garantía del producto es la otorgada directamente por el fabricante. HEAVYMARKET S.A.S. no se hace responsable por daños consecuentes derivados de defectos de fabricación o de una instalación deficiente; dicha responsabilidad recaerá sobre el fabricante o el cliente, según corresponda.<br><br>
            <strong>Tiempos de Entrega:</strong> El tiempo estipulado es una estimación basada en condiciones normales. No contempla retrasos por vuelos, procesos aduaneros o casos fortuitos. En caso de cualquier novedad, se informará oportunamente al cliente.<br><br>
            <strong>Protocolo de Recepción, Reclamaciones y Devoluciones:</strong> Al momento de recibir el producto, el cliente debe verificar el estado y contenido del paquete, y manipular los empaques con cuidado. Es requisito indispensable conservar los empaques originales en buen estado para el trámite de cualquier solicitud. Las reclamaciones y devoluciones solo serán aceptadas hasta en un plazo máximo de ocho (8) días calendario, contados a partir de la fecha en que la mercancía es recibida por el cliente. Así mismo, se solicita obligatoriamente registrar en video la apertura del empaque (unboxing) como prueba en caso de mercancía faltante o daños durante el transporte. Sin el cumplimiento de estos lineamientos, cualquier reclamación posterior será difícil de procesar.<br><br>
            <strong>Aceptación:</strong> El pago de la mercancía implica la aceptación total de estas condiciones. Para asistencia adicional, contáctenos vía WhatsApp al 320 840 0279 o al correo comercial@heavymarket.net.
        </div>
    </div>

    <!-- Script de DomPDF: paginación arriba a la derecha (margen superior) -->
    <script type="text/php">
        if ( isset($pdf) ) {
            $pdf->page_script('
                $font = $fontMetrics->get_font("Helvetica", "normal");
                $size = 8.5;
                $text = "Pagina: " . $PAGE_NUM . "/" . $PAGE_COUNT;
                $textWidth = $fontMetrics->get_text_width($text, $font, $size);
                $pageWidth = $pdf->get_width();
                $rightMargin = 28;
                $x = $pageWidth - $textWidth - $rightMargin;
                $pdf->text($x, 22, $text, $font, $size);
            ');
        }
    </script>

</body>
</html>
