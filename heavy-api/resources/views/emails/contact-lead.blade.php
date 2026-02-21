<x-mail::message>
# Tienes un nuevo Cliente Interesado (Landing Page)

Un nuevo cliente ha dejado sus datos de contacto en la sección "Contáctanos" de la Landing Page. A continuación, el detalle:

- **Nombre:** {{ $lead->nombre_completo }}
- **Empresa:** {{ $lead->empresa ?? 'No especificada' }}
- **Correo Electrónico:** [{{ $lead->correo_electronico }}](mailto:{{ $lead->correo_electronico }})
- **Teléfono:** {{ $lead->telefono ?? 'No especificado' }} 

---

### Motivo de consulta:
> {{ $lead->motivo_consulta }}

---

<x-mail::button :url="config('app.frontend_url') . '/app/gestion-landing/contact-leads'">
Ver en el Panel de Administración
</x-mail::button>

Gracias,<br>
{{ config('app.name') }}
</x-mail::message>
