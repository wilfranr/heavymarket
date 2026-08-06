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
        .logo-cell {
            width: 35%;
        }
        .logo {
            max-width: 140px;
        }
        .company-name {
            font-size: 14px;
            font-weight: bold;
            color: #334155;
            margin: 0;
        }
        .company-info {
            font-size: 8px;
            color: #4b5563;
        }
        .doc-info {
            text-align: right;
        }
        .doc-type {
            font-size: 9px;
            color: #4b5563;
        }
        .doc-number {
            font-size: 14px;
            font-weight: bold;
            color: #334155;
        }

        /* Supplier Info Block */
        .supplier-block {
            margin-top: 10px;
            margin-bottom: 10px;
        }
        .supplier-table {
            width: 100%;
            border: 1px solid #334155;
        }
        .supplier-table td {
            padding: 3px 6px;
            border: 0.5px solid #94a3b8;
            font-size: 9px;
        }
        .label-cell {
            background-color: #e5e7eb;
            font-weight: bold;
            width: 80px;
            text-transform: uppercase;
            font-size: 8px;
        }
        .value-cell {
            background-color: #ffffff;
        }
        .dates-cell {
            background-color: #e5e7eb;
            font-weight: bold;
            font-size: 8px;
            text-transform: uppercase;
            padding: 3px 6px;
            border: 0.5px solid #94a3b8;
        }
        .date-value {
            padding: 3px 6px;
            border: 0.5px solid #94a3b8;
            font-size: 9px;
        }

        /* Items Table */
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

        /* Totals */
        .bottom-section {
            margin-top: 15px;
        }
        .totals-container {
            width: 40%;
            float: right;
        }
        .totals-table td {
            padding: 4px 8px;
            font-size: 10px;
        }
        .totals-label {
            text-align: right;
            font-weight: bold;
            text-transform: uppercase;
            padding-right: 15px;
        }
        .total-highlight {
            background-color: #e5e7eb;
            font-weight: bold;
            font-size: 12px;
        }
        .total-highlight-value {
            background-color: #475569;
            color: white;
            font-weight: bold;
            font-size: 12px;
            text-align: right;
            padding: 6px 10px;
        }

        /* Signatures */
        .signatures {
            clear: both;
            margin-top: 40px;
            width: 100%;
        }
        .signature-block {
            width: 45%;
            display: inline-block;
            vertical-align: top;
        }
        .signature-label {
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 20px;
        }
        .signature-line {
            border-top: 1px solid #334155;
            padding-top: 3px;
            font-size: 7px;
            color: #6b7280;
        }

        /* Footer */
        .footer {
            position: fixed;
            bottom: 0;
            width: 100%;
            text-align: center;
            padding-bottom: 10px;
        }
        .brand-text {
            font-weight: 900;
            font-style: italic;
            font-size: 12px;
            color: #334155;
            margin: 0 10px;
            display: inline-block;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <table class="header-table">
        <tr>
            <td class="logo-cell">
                @if(isset($empresa->logo_dark))
                    <img src="{{ public_path('storage/' . $empresa->logo_dark) }}" class="logo">
                @elseif(isset($empresa->logo_light))
                    <img src="{{ public_path('storage/' . $empresa->logo_light) }}" class="logo">
                @else
                    <div style="background: #334155; color: white; padding: 10px; border-radius: 5px; font-weight: bold; text-align: center; display: inline-block;">HEAVYMARKET</div>
                @endif
                <p class="company-name">{{ strtoupper($empresa->nombre ?? 'HEAVYMARKET S.A.S') }}</p>
                <div class="company-info">
                    NIT: {{ $empresa->nit ?? '901881206' }}<br>
                    {{ $empresa->direccion ?? 'CRA 79 C 40 A 72' }}<br>
                    TEL: {{ $empresa->telefono ?? '+573046292601' }}<br>
                    {{ $empresa->email ?? 'contabilidad@heavymarket.net' }}
                </div>
            </td>
            <td class="doc-info">
                <div class="doc-type">Orden de compra</div>
                <div class="doc-number">No. {{ $ordenCompra->id }}</div>
            </td>
        </tr>
    </table>

    <!-- Supplier Info -->
    <div class="supplier-block">
        <table class="supplier-table">
            <tr>
                <td class="label-cell">SEÑOR(ES)</td>
                <td class="value-cell" colspan="3">{{ strtoupper($ordenCompra->proveedor->razon_social ?? $ordenCompra->proveedor->nombre ?? 'N/A') }}</td>
                <td class="dates-cell">FECHA DE EXPEDICIÓN</td>
                <td class="date-value">{{ $ordenCompra->fecha_expedicion ? $ordenCompra->fecha_expedicion->format('d/m/Y') : date('d/m/Y') }}</td>
            </tr>
            <tr>
                <td class="label-cell">DIRECCIÓN</td>
                <td class="value-cell">{{ strtoupper($ordenCompra->proveedor->direccion ?? 'N/A') }}</td>
                <td class="label-cell">CIUDAD</td>
                <td class="value-cell">{{ strtoupper($ordenCompra->proveedor->city->name ?? 'BOGOTÁ') }}</td>
                <td class="dates-cell">FECHA DE ENTREGA</td>
                <td class="date-value">{{ $ordenCompra->fecha_entrega ? $ordenCompra->fecha_entrega->format('d/m/Y') : 'Por definir' }}</td>
            </tr>
            <tr>
                <td class="label-cell">TELÉFONO</td>
                <td class="value-cell">{{ $ordenCompra->proveedor->telefono ?? $ordenCompra->proveedor->celular ?? 'N/A' }}</td>
                <td class="label-cell">NIT</td>
                <td class="value-cell">{{ $ordenCompra->proveedor->documento ?? 'N/A' }}</td>
                <td class="dates-cell"></td>
                <td class="date-value"></td>
            </tr>
        </table>
    </div>

    <!-- Items Table -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 50%;">Referencia / Ítem</th>
                <th style="width: 15%;" class="text-right">Costo unitario</th>
                <th style="width: 10%;" class="text-center">Cantidad</th>
                <th style="width: 10%;" class="text-right">Descuento</th>
                <th style="width: 15%;" class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            @php $itemCount = 0; @endphp
            @foreach($ordenCompra->detalles as $detalle)
                <tr class="{{ $itemCount % 2 == 0 ? '' : 'alt-row' }}">
                    <td>
                        {{ $detalle->referencia->referencia ?? 'N/A' }}
                        @if($detalle->referencia->articulo)
                            / {{ strtoupper($detalle->referencia->articulo->definicion ?? '') }}
                        @endif
                    </td>
                    <td class="text-right">$ {{ number_format($detalle->valor_unitario ?? 0, 0, ',', '.') }}</td>
                    <td class="text-center">{{ $detalle->cantidad ?? 1 }}</td>
                    <td class="text-right">0.00%</td>
                    <td class="text-right">$ {{ number_format($detalle->valor_total ?? 0, 0, ',', '.') }}</td>
                </tr>
                @php $itemCount++; @endphp
            @endforeach
            @for($i = $itemCount; $i < 8; $i++)
                <tr class="{{ $i % 2 == 0 ? '' : 'alt-row' }}">
                    <td>&nbsp;</td>
                    <td class="text-right"></td>
                    <td class="text-center"></td>
                    <td class="text-right"></td>
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
                    <td class="text-right">$ {{ number_format($ordenCompra->valor_total ?? 0, 0, ',', '.') }}</td>
                </tr>
                <tr>
                    <td class="totals-label">Descuento</td>
                    <td class="text-right">$ 0</td>
                </tr>
                <tr>
                    <td class="totals-label">IVA (19.00%)</td>
                    <td class="text-right">$ {{ number_format(($ordenCompra->valor_total ?? 0) * 0.19, 0, ',', '.') }}</td>
                </tr>
                <tr>
                    <td class="total-highlight">Total</td>
                    <td class="total-highlight-value">$ {{ number_format(($ordenCompra->valor_total ?? 0) * 1.19, 0, ',', '.') }}</td>
                </tr>
            </table>
        </div>
    </div>

    <!-- Signatures -->
    <div class="signatures">
        <div class="signature-block">
            <div class="signature-label">Elaborado por</div>
            <div class="signature-line">Firma y fecha</div>
        </div>
        <div class="signature-block" style="float: right;">
            <div class="signature-label">Aceptada, firma y/o sello y fecha</div>
            <div class="signature-line">Firma del proveedor</div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <span class="brand-text" style="color: #facc15;">CAT</span>
        <span class="brand-text" style="color: #2563eb;">KOMATSU</span>
        <span class="brand-text" style="color: #ea580c;">HITACHI</span>
        <span class="brand-text" style="color: #475569;">VOLVO</span>
        <span class="brand-text" style="color: #dc2626;">TEREX</span>
        <span class="brand-text" style="color: #0284c7;">KOBELCO</span>
    </div>
</body>
</html>
