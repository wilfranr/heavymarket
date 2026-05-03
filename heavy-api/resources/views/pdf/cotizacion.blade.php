<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Cotización COT-{{ $cotizacion->id }}</title>
    <style>
        @page {
            margin: 1cm;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            color: #1a1a1a;
            font-size: 10px;
            line-height: 1.2;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        /* Header */
        .header-table {
            margin-bottom: 5px;
        }
        .company-name {
            font-size: 18px;
            font-weight: bold;
            color: #334155;
            text-align: center;
            margin: 0;
        }
        .company-info {
            text-align: center;
            font-size: 8px;
            color: #4b5563;
        }
        .logo-container {
            text-align: right;
            width: 150px;
        }
        .logo {
            max-width: 140px;
        }
        
        .doc-title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin: 10px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
        }

        /* Bloques de Información */
        .info-block {
            background-color: #f3f4f6;
            margin-bottom: 10px;
            border: 1px solid #d1d5db;
        }
        .info-table td {
            padding: 4px 8px;
            border: 0.5px solid #d1d5db;
        }
        .label-cell {
            background-color: #e5e7eb;
            font-weight: bold;
            width: 80px;
            text-transform: uppercase;
            font-size: 9px;
        }
        .value-cell {
            background-color: #ffffff;
        }
        .id-cell {
            background-color: #9ca3af;
            color: white;
            font-weight: bold;
            text-align: center;
            font-size: 14px;
        }

        /* Tabla de Items */
        .items-table {
            margin-top: 10px;
            border: 1px solid #334155;
        }
        .items-table th {
            background-color: #475569;
            color: white;
            padding: 6px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 9px;
            border: 0.5px solid #1e293b;
        }
        .items-table td {
            padding: 6px;
            border: 0.5px solid #94a3b8;
            font-size: 9px;
            height: 15px;
        }
        .alt-row {
            background-color: #f8fafc;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }

        /* Totales y Notas */
        .bottom-section {
            margin-top: 15px;
        }
        .bank-info {
            width: 60%;
            font-size: 9px;
            font-weight: bold;
        }
        .totals-container {
            width: 35%;
            float: right;
        }
        .totals-table td {
            padding: 5px;
            font-size: 11px;
        }
        .totals-label {
            text-align: right;
            font-weight: bold;
            text-transform: uppercase;
            padding-right: 15px;
        }
        .total-highlight {
            color: #dc2626;
            font-weight: bold;
            font-size: 14px;
        }
        .legal-notes {
            clear: both;
            margin-top: 20px;
            font-size: 7.5px;
            color: #4b5563;
            text-align: justify;
            border-top: 1px solid #d1d5db;
            padding-top: 5px;
        }

        /* Marcas Footer */
        .brands-footer {
            position: fixed;
            bottom: 0;
            width: 100%;
            text-align: center;
            padding-bottom: 10px;
        }
        .brand-text {
            font-weight: 900;
            font-style: italic;
            font-size: 14px;
            color: #334155;
            margin: 0 15px;
            display: inline-block;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <table class="header-table">
        <tr>
            <td style="width: 20%;"></td>
            <td style="width: 60%;">
                <p class="company-name">{{ strtoupper($empresa->nombre ?? 'HEAVYMARKET') }}</p>
                <div class="company-info">
                    NIT: {{ $empresa->nit ?? '901337993-8' }}<br>
                    {{ $empresa->direccion ?? 'BOGOTÁ, COLOMBIA' }}<br>
                    TELÉFONO: {{ $empresa->telefono ?? '6578676' }}<br>
                    {{ $empresa->email ?? 'wilfranr@gmail.com' }}<br>
                    {{ strtoupper($empresa->ciudad ?? 'BOGOTÁ') }}, {{ strtoupper($empresa->pais ?? 'COLOMBIA') }}
                </div>
            </td>
            <td class="logo-container">
                @if(isset($empresa->logo_dark))
                    <img src="{{ public_path('storage/' . $empresa->logo_dark) }}" class="logo">
                @elseif(isset($empresa->logo_light))
                    <img src="{{ public_path('storage/' . $empresa->logo_light) }}" class="logo">
                @else
                    <div style="background: #334155; color: white; padding: 10px; border-radius: 5px; font-weight: bold; text-align: center;">HEAVYMARKET</div>
                @endif
            </td>
        </tr>
    </table>

    <div class="doc-title">Cotización</div>

    <!-- Bloque 1: COT e Info General -->
    <div class="info-block">
        <table class="info-table">
            <tr>
                <td class="label-cell id-cell">COT</td>
                <td class="value-cell id-cell" style="color: #1a1a1a;">{{ $cotizacion->id }}</td>
                <td class="label-cell">ELABORADA POR:</td>
                <td class="value-cell" colspan="3">{{ strtoupper($cotizacion->user->name) }}</td>
            </tr>
            <tr>
                <td class="label-cell">FECHA</td>
                <td class="value-cell text-center">{{ $cotizacion->fecha_emision->format('Y-m-d') }}</td>
                <td class="label-cell">RAZON SOCIAL:</td>
                <td class="value-cell" style="width: 200px;">{{ strtoupper($cotizacion->tercero->razon_social ?? $cotizacion->tercero->nombre) }}</td>
                <td class="label-cell">NIT:</td>
                <td class="value-cell">{{ $cotizacion->tercero->documento }}</td>
            </tr>
            <tr>
                <td class="label-cell">VALIDEZ</td>
                <td class="value-cell text-center">{{ $cotizacion->fecha_vencimiento->format('Y-m-d') }}</td>
                <td class="label-cell">CIUDAD:</td>
                <td class="value-cell">{{ strtoupper($cotizacion->tercero->city->name ?? 'BOGOTÁ') }}</td>
                <td class="label-cell">TELEFONO:</td>
                <td class="value-cell">{{ $cotizacion->tercero->telefono ?? $cotizacion->tercero->celular }}</td>
            </tr>
        </table>
    </div>

    <!-- Bloque 2: Datos Máquina -->
    <div class="info-block">
        <table class="info-table">
            <tr>
                <td class="label-cell">MAQUINA:</td>
                <td class="value-cell">{{ strtoupper($cotizacion->pedido->maquina->tipo ?? 'N/A') }}</td>
                <td class="label-cell">DIRECCION:</td>
                <td class="value-cell" colspan="3">{{ strtoupper($cotizacion->tercero->direccion ?? 'N/A') }}</td>
            </tr>
            <tr>
                <td class="label-cell">MARCA:</td>
                <td class="value-cell">{{ strtoupper($cotizacion->pedido->maquina->fabricante->nombre ?? 'N/A') }}</td>
                <td class="label-cell">E-MAIL:</td>
                <td class="value-cell">{{ strtolower($cotizacion->tercero->email ?? 'N/A') }}</td>
                <td class="label-cell">PAGO:</td>
                <td class="value-cell">CONTADO</td>
            </tr>
            <tr>
                <td class="label-cell">MODELO:</td>
                <td class="value-cell">{{ strtoupper($cotizacion->pedido->maquina->modelo ?? 'N/A') }}</td>
                <td class="label-cell">CONTACTO:</td>
                <td class="value-cell">{{ strtoupper($cotizacion->pedido->contacto->nombre ?? 'N/A') }}</td>
                <td class="label-cell">REFERENCIA:</td>
                <td class="value-cell">{{ $cotizacion->pedido->referencia_externa ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="label-cell">SERIE:</td>
                <td class="value-cell">{{ strtoupper($cotizacion->pedido->maquina->serie ?? 'N/A') }}</td>
                <td class="label-cell">TELEFONO:</td>
                <td class="value-cell" colspan="3">{{ $cotizacion->pedido->contacto->telefono ?? 'N/A' }}</td>
            </tr>
        </table>
    </div>

    <!-- Tabla de Items -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 30px;">ITEM</th>
                <th style="width: 40px;">CANT</th>
                <th style="width: 90px;">REFERENCIA</th>
                <th>DESCRIPCION</th>
                <th style="width: 70px;">MARCA</th>
                <th style="width: 70px;">ENTREGA</th>
                <th style="width: 80px;">VENTA</th>
                <th style="width: 90px;">TOTAL</th>
            </tr>
        </thead>
        <tbody>
            @foreach($cotizacion->referenciasProveedores as $index => $item)
                <tr class="{{ $index % 2 == 0 ? '' : 'alt-row' }}">
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td class="text-center">{{ $item->pedidoReferenciaProveedor->cantidad }}</td>
                    <td class="text-center">
                        @if($item->mostrar_referencia)
                            {{ $item->pedidoReferenciaProveedor->referencia->referencia ?? 'N/A' }}
                        @else
                            N/A
                        @endif
                    </td>
                    <td>{{ strtoupper($item->pedidoReferenciaProveedor->pedidoReferencia->referencia->articulo->definicion ?? 'REPUESTO') }}</td>
                    <td class="text-center">{{ strtoupper($item->pedidoReferenciaProveedor->marca->nombre ?? 'N/A') }}</td>
                    <td class="text-center">
                        @if(($item->pedidoReferenciaProveedor->dias_entrega ?? 0) == 0)
                            INMEDIATA
                        @else
                            {{ $item->pedidoReferenciaProveedor->dias_entrega }} DÍAS
                        @endif
                    </td>
                    <td class="text-right">$ {{ number_format($item->pedidoReferenciaProveedor->valor_unidad, 0, ',', '.') }}</td>
                    <td class="text-right">$ {{ number_format($item->pedidoReferenciaProveedor->valor_total, 0, ',', '.') }}</td>
                </tr>
            @endforeach
            <!-- Filas vacías para completar el diseño como la referencia -->
            @for($i = count($cotizacion->referenciasProveedores); $i < 10; $i++)
                <tr class="{{ $i % 2 == 0 ? '' : 'alt-row' }}">
                    <td>&nbsp;</td>
                    <td></td><td></td><td></td><td></td><td></td>
                    <td class="text-right">$ -</td>
                    <td class="text-right">$ -</td>
                </tr>
            @endfor
        </tbody>
    </table>

    <!-- Sección Inferior -->
    <div class="bottom-section">
        <div style="float: left;" class="bank-info">
            CONSIGNAR A NOMBRE DE HEAVYMARKET<br>
            CUENTA DE AHORROS NO. 073514564 DEL BANCO DE BOGOTA<br>
            CUENTA DE AHORROS NO. 108-000011-20 DE BANCOLOMBIA
        </div>

        <div class="totals-container">
            <table class="totals-table">
                <tr>
                    <td class="totals-label">SUBTOTAL</td>
                    <td class="text-right">$ {{ number_format($cotizacion->total, 0, ',', '.') }}</td>
                </tr>
                <tr>
                    <td class="totals-label">IVA 19%</td>
                    <td class="text-right">$ {{ number_format($cotizacion->total * 0.19, 0, ',', '.') }}</td>
                </tr>
                <tr>
                    <td class="totals-label" style="font-size: 14px;">TOTAL</td>
                    <td class="text-right total-highlight">$ {{ number_format($cotizacion->total * 1.19, 0, ',', '.') }}</td>
                </tr>
            </table>
        </div>
    </div>

    <div class="legal-notes">
        Cotización valida hasta la fecha establecida en el campo "validez". Esta cotización está sujeta a venta previa. La garantía del producto ofrecido aquí es la misma garantía ofrecida por el fabricante. HEAVYMARKET no se hace responsable por problemas consecuentes por materiales de fabricación y/o instalación deficiente del producto, esto será responsabilidad del cliente o el fabricante según corresponda el caso. El tiempo de entrega estipulado en la cotización presente es una estimación según condiciones normales de transporte o importación, no cuenta con retrasos en vuelos, aduanas o casos fortuitos.
    </div>

    <!-- Footer Marcas -->
    <div class="brands-footer">
        <span class="brand-text" style="color: #facc15;">CAT</span>
        <span class="brand-text" style="color: #2563eb;">KOMATSU</span>
        <span class="brand-text" style="color: #ea580c;">HITACHI</span>
        <span class="brand-text" style="color: #475569;">VOLVO</span>
        <span class="brand-text" style="color: #dc2626;">TEREX</span>
        <span class="brand-text" style="color: #0284c7;">KOBELCO</span>
    </div>

</body>
</html>
