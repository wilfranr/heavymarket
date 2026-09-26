<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Orden de Compra OC-{{ $ordenCompra->id }}</title>
    <style>
        @page {
            margin: 1cm;
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

        .page-frame {
            border: 1.4px solid #1e293b;
            padding: 14px 16px 16px 16px;
        }

        /* Header */
        .header-table {
            margin-bottom: 14px;
        }
        .header-table td {
            vertical-align: middle;
        }
        .logo-cell {
            width: 26%;
            text-align: left;
        }
        .logo {
            max-width: 140px;
            max-height: 65px;
            object-fit: contain;
        }
        .company-cell {
            width: 48%;
            text-align: center;
        }
        .company-name {
            font-size: 13px;
            font-weight: bold;
            color: #0f172a;
            margin: 0 0 3px 0;
        }
        .company-info {
            font-size: 8.5px;
            color: #334155;
            line-height: 1.5;
        }
        .doc-cell {
            width: 26%;
            text-align: right;
        }
        .doc-type {
            font-size: 10px;
            color: #334155;
        }
        .doc-number {
            font-size: 15px;
            font-weight: bold;
            color: #0f172a;
        }

        /* Supplier + dates block */
        .supplier-outer {
            margin-bottom: 12px;
        }
        .supplier-outer td {
            vertical-align: top;
            padding: 0;
        }
        .supplier-left {
            width: 78%;
        }
        .supplier-right {
            width: 22%;
        }
        .supplier-table, .dates-table {
            border: 1px solid #334155;
        }
        .supplier-table td, .dates-table td {
            border: 0.5px solid #94a3b8;
            padding: 4px 6px;
            font-size: 8.5px;
            height: 12px;
        }
        .label-cell {
            background-color: #e5e7eb;
            font-weight: bold;
            width: 90px;
            text-transform: uppercase;
            font-size: 7.5px;
            color: #334155;
        }
        .value-cell {
            background-color: #ffffff;
            color: #0f172a;
        }
        .dates-label {
            background-color: #e5e7eb;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 7.5px;
            color: #334155;
            text-align: center;
        }
        .dates-value {
            background-color: #ffffff;
            color: #0f172a;
            text-align: center;
        }

        /* Items Table */
        .items-table {
            margin-top: 10px;
            border: 1px solid #334155;
        }
        .items-table th {
            background-color: #f1f5f9;
            color: #1e293b;
            padding: 6px;
            font-weight: bold;
            font-size: 9px;
            border: 0.5px solid #cbd5e1;
        }
        .items-table td {
            padding: 6px;
            border: 0.5px solid #cbd5e1;
            font-size: 8.5px;
            height: 15px;
            color: #1e293b;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }

        /* Totals */
        .bottom-section {
            margin-top: 15px;
        }
        .totals-container {
            width: 45%;
            float: right;
        }
        .totals-table td {
            padding: 4px 8px;
            font-size: 9px;
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
            background-color: #9aa5b1;
            color: #0f172a;
            font-weight: bold;
            font-size: 10.5px;
            padding: 6px 8px;
        }

        /* Signatures */
        .signatures {
            clear: both;
            margin-top: 45px;
            width: 100%;
        }
        .signatures-table td {
            width: 50%;
            padding: 0 10px;
        }
        .signature-line {
            border-top: 1px solid #334155;
            margin-bottom: 4px;
        }
        .signature-caption {
            font-size: 7.5px;
            font-weight: bold;
            text-align: center;
            color: #334155;
            text-transform: uppercase;
        }
    </style>
</head>
<body>

    @php
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

    <div class="page-frame">

        <!-- Header -->
        <table class="header-table">
            <tr>
                <td class="logo-cell">
                    @if($logoPath)
                        <img src="{{ $logoPath }}" class="logo">
                    @else
                        <div style="background: #334155; color: white; padding: 10px; border-radius: 5px; font-weight: bold; text-align: center; display: inline-block;">HEAVYMARKET</div>
                    @endif
                </td>
                <td class="company-cell">
                    <div class="company-name">{{ strtoupper($empresa->nombre ?? 'HEAVYMARKET S.A.S') }}</div>
                    <div class="company-info">
                        {{ $empresa->nit ?? '901881206' }}<br>
                        {{ $empresa->direccion ?? 'CRA 79 C 40 A 72' }}<br>
                        {{ $empresa->telefono ?? '+573046292601' }}<br>
                        {{ $empresa->email ?? 'contabilidad@heavymarket.net' }}
                    </div>
                </td>
                <td class="doc-cell">
                    <div class="doc-type">Orden de compra</div>
                    <div class="doc-number">No. {{ $ordenCompra->id }}</div>
                </td>
            </tr>
        </table>

        <!-- Supplier Info + Fechas -->
        <table class="supplier-outer">
            <tr>
                <td class="supplier-left">
                    <table class="supplier-table">
                        <tr>
                            <td class="label-cell">SEÑOR(ES)</td>
                            <td class="value-cell" colspan="3">{{ strtoupper($ordenCompra->proveedor->razon_social ?? $ordenCompra->proveedor->nombre ?? 'N/A') }}</td>
                        </tr>
                        <tr>
                            <td class="label-cell">DIRECCIÓN</td>
                            <td class="value-cell" colspan="3">{{ strtoupper($ordenCompra->proveedor->direccion ?? 'N/A') }}</td>
                        </tr>
                        <tr>
                            <td class="label-cell">CIUDAD</td>
                            <td class="value-cell" colspan="3">{{ strtoupper($ordenCompra->proveedor->city->name ?? 'BOGOTÁ') }}</td>
                        </tr>
                        <tr>
                            <td class="label-cell">TELÉFONO</td>
                            <td class="value-cell">{{ $ordenCompra->proveedor->telefono ?? $ordenCompra->proveedor->celular ?? 'N/A' }}</td>
                            <td class="label-cell" style="width: 50px;">NIT</td>
                            <td class="value-cell">{{ $ordenCompra->proveedor->numero_documento ?? $ordenCompra->proveedor->documento ?? 'N/A' }}</td>
                        </tr>
                    </table>
                </td>
                <td class="supplier-right">
                    <table class="dates-table">
                        <tr>
                            <td class="dates-label">FECHA DE EXPEDICIÓN</td>
                        </tr>
                        <tr>
                            <td class="dates-value">{{ $ordenCompra->fecha_expedicion ? $ordenCompra->fecha_expedicion->format('d/m/Y') : date('d/m/Y') }}</td>
                        </tr>
                        <tr>
                            <td class="dates-label">FECHA DE ENTREGA</td>
                        </tr>
                        <tr>
                            <td class="dates-value">{{ $ordenCompra->fecha_entrega ? $ordenCompra->fecha_entrega->format('d/m/Y') : 'Por definir' }}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <!-- Items Table -->
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 44%; text-align: left;">Referencia / Ítem</th>
                    <th style="width: 16%;" class="text-right">Precio</th>
                    <th style="width: 12%;" class="text-center">Cantidad</th>
                    <th style="width: 13%;" class="text-center">Descuento</th>
                    <th style="width: 15%;" class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                @php $itemCount = 0; @endphp
                @foreach($ordenCompra->detalles as $detalle)
                    <tr>
                        <td>
                            @php
                                $definicion = $detalle->referencia->articulo->definicion ?? $detalle->referencia->articulo_definicion ?? $detalle->referencia->descripcion ?? null;
                                $refCodigo = $detalle->referencia->referencia ?? 'N/A';
                                $marcaNombre = $detalle->referencia->marca->nombre ?? null;
                            @endphp
                            @if($definicion)
                                {{ strtoupper($definicion) }} ({{ $refCodigo }})
                            @else
                                {{ $refCodigo }}
                            @endif
                            @if($marcaNombre)
                                <span style="color: #64748b; font-size: 7.5px;"> - Marca: {{ strtoupper($marcaNombre) }}</span>
                            @endif
                        </td>
                        <td class="text-right">$ {{ number_format($detalle->valor_unitario ?? 0, 0, ',', '.') }}</td>
                        <td class="text-center">{{ $detalle->cantidad ?? 1 }}</td>
                        <td class="text-center">0.00%</td>
                        <td class="text-right">$ {{ number_format($detalle->valor_total ?? 0, 0, ',', '.') }}</td>
                    </tr>
                    @php $itemCount++; @endphp
                @endforeach
                @for($i = $itemCount; $i < 8; $i++)
                    <tr>
                        <td>&nbsp;</td>
                        <td class="text-right"></td>
                        <td class="text-center"></td>
                        <td class="text-center"></td>
                        <td class="text-right"></td>
                    </tr>
                @endfor
            </tbody>
        </table>

        <!-- Totals -->
        <div class="bottom-section">
            <div class="totals-container">
                <table class="totals-table">
                    <tr>
                        <td class="totals-label">Subtotal</td>
                        <td class="totals-value">$ {{ number_format($ordenCompra->valor_total ?? 0, 0, ',', '.') }}</td>
                    </tr>
                    <tr>
                        <td class="totals-label">Descuento</td>
                        <td class="totals-value">$ 0</td>
                    </tr>
                    <tr>
                        <td class="totals-label">IVA (19.00%)</td>
                        <td class="totals-value">$ {{ number_format(($ordenCompra->valor_total ?? 0) * 0.19, 0, ',', '.') }}</td>
                    </tr>
                    <tr class="total-row">
                        <td class="totals-label">Total</td>
                        <td class="totals-value">$ {{ number_format(($ordenCompra->valor_total ?? 0) * 1.19, 0, ',', '.') }}</td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- Signatures -->
        <div class="signatures">
            <table class="signatures-table">
                <tr>
                    <td>
                        <div class="signature-line"></div>
                        <div class="signature-caption">Elaborado por</div>
                    </td>
                    <td>
                        <div class="signature-line"></div>
                        <div class="signature-caption">Aceptada, firma y/o sello y fecha</div>
                    </td>
                </tr>
            </table>
        </div>

    </div>
</body>
</html>
