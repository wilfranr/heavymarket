<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Orden de Trabajo OT-{{ $ordenTrabajo->id }}</title>
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

        /* Bloques de Informacion */
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

        /* Footer */
        .bottom-section {
            margin-top: 15px;
        }
        .legal-notes {
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
                    {{ $empresa->direccion ?? 'BOGOTA, COLOMBIA' }}<br>
                    TELEFONO: {{ $empresa->telefono ?? '6578676' }}<br>
                    {{ $empresa->email ?? 'wilfranr@gmail.com' }}<br>
                    {{ strtoupper($empresa->ciudad ?? 'BOGOTA') }}, {{ strtoupper($empresa->pais ?? 'COLOMBIA') }}
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

    <div class="doc-title">Orden de Trabajo</div>

    <!-- Bloque 1: OT e Info General -->
    <div class="info-block">
        <table class="info-table">
            <tr>
                <td class="label-cell id-cell">OT</td>
                <td class="value-cell id-cell" style="color: #1a1a1a;">{{ $ordenTrabajo->id }}</td>
                <td class="label-cell">ESTADO:</td>
                <td class="value-cell" colspan="3">{{ strtoupper($ordenTrabajo->estado ?? 'PENDIENTE') }}</td>
            </tr>
            <tr>
                <td class="label-cell">FECHA INGRESO</td>
                <td class="value-cell text-center">{{ $ordenTrabajo->fecha_ingreso?->format('Y-m-d') ?? date('Y-m-d') }}</td>
                <td class="label-cell">RAZON SOCIAL:</td>
                <td class="value-cell" style="width: 200px;">{{ strtoupper($ordenTrabajo->tercero->razon_social ?? $ordenTrabajo->tercero->nombre ?? 'N/A') }}</td>
                <td class="label-cell">NIT:</td>
                <td class="value-cell">{{ $ordenTrabajo->tercero->documento ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="label-cell">FECHA ENTREGA</td>
                <td class="value-cell text-center">{{ $ordenTrabajo->fecha_entrega?->format('Y-m-d') ?? 'POR DEFINIR' }}</td>
                <td class="label-cell">CIUDAD:</td>
                <td class="value-cell">{{ strtoupper($ordenTrabajo->tercero->city->name ?? 'BOGOTA') }}</td>
                <td class="label-cell">TELEFONO:</td>
                <td class="value-cell">{{ $ordenTrabajo->tercero->telefono ?? $ordenTrabajo->tercero->celular ?? 'N/A' }}</td>
            </tr>
        </table>
    </div>

    <!-- Bloque 2: Datos Pedido/Cotizacion origen -->
    <div class="info-block">
        <table class="info-table">
            <tr>
                <td class="label-cell">PEDIDO:</td>
                <td class="value-cell">#{{ $ordenTrabajo->pedido_id ?? 'N/A' }}</td>
                <td class="label-cell">COTIZACION:</td>
                <td class="value-cell">COT-{{ $ordenTrabajo->cotizacion_id ?? 'N/A' }}</td>
                <td class="label-cell">TRANSPORTADORA:</td>
                <td class="value-cell">{{ $ordenTrabajo->transportadora->nombre ?? 'N/A' }}</td>
            </tr>
            @if($ordenTrabajo->pedido?->maquina)
            <tr>
                <td class="label-cell">MAQUINA:</td>
                <td class="value-cell">{{ strtoupper($ordenTrabajo->pedido->maquina->tipo ?? 'N/A') }}</td>
                <td class="label-cell">MARCA:</td>
                <td class="value-cell">{{ strtoupper($ordenTrabajo->pedido->maquina->fabricante->nombre ?? 'N/A') }}</td>
                <td class="label-cell">MODELO:</td>
                <td class="value-cell">{{ strtoupper($ordenTrabajo->pedido->maquina->modelo ?? 'N/A') }}</td>
            </tr>
            @endif
            @if($ordenTrabajo->direccion)
            <tr>
                <td class="label-cell">DIRECCION:</td>
                <td class="value-cell" colspan="5">{{ strtoupper($ordenTrabajo->direccion->direccion ?? 'N/A') }}</td>
            </tr>
            @endif
            @if($ordenTrabajo->observaciones)
            <tr>
                <td class="label-cell">OBSERVACIONES:</td>
                <td class="value-cell" colspan="5">{{ $ordenTrabajo->observaciones }}</td>
            </tr>
            @endif
        </table>
    </div>

    <!-- Tabla de Referencias -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 30px;">ITEM</th>
                <th style="width: 40px;">CANT</th>
                <th style="width: 90px;">REFERENCIA</th>
                <th>DESCRIPCION</th>
                <th style="width: 70px;">MARCA</th>
                <th style="width: 70px;">ESTADO</th>
                <th style="width: 70px;">RECIBIDO</th>
                <th style="width: 90px;">OBSERVACIONES</th>
            </tr>
        </thead>
        <tbody>
            @foreach($ordenTrabajo->referencias as $index => $item)
                <tr class="{{ $index % 2 == 0 ? '' : 'alt-row' }}">
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td class="text-center">{{ $item->cantidad }}</td>
                    <td class="text-center">
                        {{ $item->pedidoReferencia?->referencia?->referencia ?? 'N/A' }}
                    </td>
                    <td>{{ strtoupper($item->pedidoReferencia?->referencia?->articulo?->definicion ?? 'REPUESTO') }}</td>
                    <td class="text-center">{{ strtoupper($item->pedidoReferencia?->referencia?->marca?->nombre ?? 'N/A') }}</td>
                    <td class="text-center">{{ strtoupper($item->estado ?? 'PENDIENTE') }}</td>
                    <td class="text-center">
                        @if($item->recibido)
                            <strong>SI</strong>
                        @else
                            NO
                        @endif
                    </td>
                    <td>{{ $item->observaciones ?? '-' }}</td>
                </tr>
            @endforeach
            <!-- Filas vacias para completar el disenio -->
            @for($i = count($ordenTrabajo->referencias); $i < 10; $i++)
                <tr class="{{ $i % 2 == 0 ? '' : 'alt-row' }}">
                    <td>&nbsp;</td>
                    <td></td><td></td><td></td><td></td><td></td><td></td><td></td>
                </tr>
            @endfor
        </tbody>
    </table>

    <!-- Seccion Inferior -->
    <div class="bottom-section">
        <div class="legal-notes">
            Esta orden de trabajo fue generada automaticamente desde la cotizacion #{{ $ordenTrabajo->cotizacion_id ?? 'N/A' }}.
            El cliente debe verificar que todas las referencias y cantidades corresponden a lo solicitado.
            Cualquier discrepancia debe ser reportada de inmediato al area de logistica.
        </div>
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
