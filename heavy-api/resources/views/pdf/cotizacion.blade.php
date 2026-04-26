<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Cotización COT-{{ $cotizacion->id }}</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            font-size: 12px;
        }
        .header {
            width: 100%;
            margin-bottom: 20px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 10px;
        }
        .header table {
            width: 100%;
        }
        .logo {
            width: 200px;
        }
        .empresa-info {
            text-align: right;
        }
        .empresa-info h1 {
            margin: 0;
            color: #2563eb;
            font-size: 18px;
        }
        .title-section {
            text-align: center;
            margin-bottom: 20px;
        }
        .title-section h2 {
            margin: 0;
            text-transform: uppercase;
            color: #1e40af;
        }
        .info-grid {
            width: 100%;
            margin-bottom: 20px;
            border-collapse: collapse;
        }
        .info-grid td {
            padding: 5px;
            border: 1px solid #e5e7eb;
        }
        .label {
            font-weight: bold;
            background-color: #f3f4f6;
            width: 150px;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .items-table th {
            background-color: #2563eb;
            color: white;
            padding: 8px;
            text-align: left;
            text-transform: uppercase;
            font-size: 10px;
        }
        .items-table td {
            padding: 8px;
            border-bottom: 1px solid #e5e7eb;
        }
        .text-right {
            text-align: right;
        }
        .totals-table {
            width: 250px;
            margin-left: auto;
            border-collapse: collapse;
        }
        .totals-table td {
            padding: 5px;
        }
        .totals-table .total-row {
            font-weight: bold;
            font-size: 14px;
            color: #1e40af;
            border-top: 2px solid #2563eb;
        }
        .footer {
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            font-size: 10px;
            color: #6b7280;
            text-align: center;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
        }
        .page-number:after {
            content: counter(page);
        }
    </style>
</head>
<body>
    <div class="header">
        <table>
            <tr>
                <td>
                    @if(isset($empresa->logo))
                        <img src="{{ public_path('storage/' . $empresa->logo) }}" class="logo" alt="Logo">
                    @else
                        <h1 style="color: #2563eb;">HEAVY MARKET</h1>
                    @endif
                </td>
                <td class="empresa-info">
                    <h1>{{ $empresa->nombre ?? 'HEAVY MARKET S.A.S.' }}</h1>
                    <p>NIT: {{ $empresa->nit ?? '900.000.000-0' }}</p>
                    <p>{{ $empresa->direccion ?? 'Calle 123 # 45 - 67' }}</p>
                    <p>Tel: {{ $empresa->telefono ?? '601 000 0000' }}</p>
                    <p>{{ $empresa->email ?? 'contacto@heavymarket.com' }}</p>
                </td>
            </tr>
        </table>
    </div>

    <div class="title-section">
        <h2>Cotización N° COT-{{ $cotizacion->id }}</h2>
        <p>Fecha de emisión: {{ $cotizacion->fecha_emision->format('d/m/Y') }} | Vence: {{ $cotizacion->fecha_vencimiento->format('d/m/Y') }}</p>
    </div>

    <table class="info-grid">
        <tr>
            <td class="label">Cliente:</td>
            <td>{{ $cotizacion->tercero->nombre }}</td>
            <td class="label">NIT/CC:</td>
            <td>{{ $cotizacion->tercero->numero_documento }}</td>
        </tr>
        <tr>
            <td class="label">Contacto:</td>
            <td>{{ $cotizacion->pedido->contacto->nombre ?? 'N/A' }}</td>
            <td class="label">Ciudad:</td>
            <td>{{ $cotizacion->tercero->ciudad->name ?? 'N/A' }}</td>
        </tr>
        <tr>
            <td class="label">Máquina:</td>
            <td>{{ $cotizacion->pedido->maquina->tipo ?? 'N/A' }} - {{ $cotizacion->pedido->maquina->marca ?? '' }}</td>
            <td class="label">Modelo/Serie:</td>
            <td>{{ $cotizacion->pedido->maquina->modelo ?? 'N/A' }} / {{ $cotizacion->pedido->maquina->serie ?? 'N/A' }}</td>
        </tr>
        <tr>
            <td class="label">Vendedor:</td>
            <td colspan="3">{{ $cotizacion->user->name }}</td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
            <tr>
                <th>Ref.</th>
                <th>Descripción</th>
                <th>Marca</th>
                <th class="text-right">Cant.</th>
                <th class="text-right">Vr. Unitario</th>
                <th class="text-right">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach($cotizacion->referenciasProveedores as $item)
                <tr>
                    <td>{{ $item->pedidoReferenciaProveedor->referencia_codigo ?? 'N/A' }}</td>
                    <td>{{ $item->pedidoReferenciaProveedor->pedidoReferencia->referencia->articulo->definicion ?? 'Sin descripción' }}</td>
                    <td>{{ $item->pedidoReferenciaProveedor->marca->nombre ?? 'N/A' }}</td>
                    <td class="text-right">{{ $item->cantidad }}</td>
                    <td class="text-right">${{ number_format($item->precio_unitario, 0, ',', '.') }}</td>
                    <td class="text-right">${{ number_format($item->cantidad * $item->precio_unitario, 0, ',', '.') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals-table">
        <tr>
            <td>Subtotal:</td>
            <td class="text-right">${{ number_format($cotizacion->total, 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td>IVA (19%):</td>
            <td class="text-right">${{ number_format($cotizacion->total * 0.19, 0, ',', '.') }}</td>
        </tr>
        <tr class="total-row">
            <td>TOTAL:</td>
            <td class="text-right">${{ number_format($cotizacion->total * 1.19, 0, ',', '.') }}</td>
        </tr>
    </table>

    @if($cotizacion->observaciones)
        <div style="margin-top: 30px;">
            <p><strong>Observaciones:</strong></p>
            <p>{{ $cotizacion->observaciones }}</p>
        </div>
    @endif

    <div class="footer">
        <p>{{ $empresa->nombre ?? 'HEAVY MARKET S.A.S.' }} - Generado por HeavyMarket Intelligence</p>
        <p>Página <span class="page-number"></span></p>
    </div>
</body>
</html>
