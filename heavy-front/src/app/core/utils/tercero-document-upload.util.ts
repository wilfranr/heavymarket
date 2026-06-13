import { HttpEvent, HttpResponse } from '@angular/common/http';

export interface TerceroDocumentFileValue {
    path: string;
    name: string;
    size: number;
    url?: string;
    status?: 'pending' | 'uploading' | 'done';
    progress?: number;
    objectURL?: string;
}

export interface TerceroUploadApiResponse {
    success: boolean;
    file_url?: string;
    file_name?: string;
    original_name?: string;
    size?: number;
}

export const TERCERO_DOCUMENT_FIELDS = [
    { key: 'rut', label: 'Adjuntar RUT' },
    { key: 'certificacion_bancaria', label: 'Adjuntar Certificación Bancaria' },
    { key: 'camara_comercio', label: 'Adjuntar Cámara de Comercio' },
    { key: 'cedula_representante_legal', label: 'Adjuntar Cédula Representante Legal' }
] as const;

export type TerceroDocumentFieldKey = (typeof TERCERO_DOCUMENT_FIELDS)[number]['key'];

export function parseTerceroUploadResponse(event: { originalEvent?: HttpEvent<unknown>; xhr?: XMLHttpRequest }): TerceroUploadApiResponse | null {
    let body: unknown = null;

    const originalEvent = event.originalEvent;
    if (originalEvent instanceof HttpResponse) {
        body = originalEvent.body;
    } else if (event.xhr?.response) {
        try {
            body = JSON.parse(event.xhr.response);
        } catch {
            return null;
        }
    }

    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch {
            return null;
        }
    }

    if (body && typeof body === 'object' && 'success' in body) {
        return body as TerceroUploadApiResponse;
    }

    return null;
}

export function buildUploadedDocumentValue(response: TerceroUploadApiResponse): TerceroDocumentFileValue {
    return {
        path: response.file_name ?? '',
        name: response.original_name ?? response.file_name?.split('/').pop() ?? 'Archivo',
        size: response.size ?? 0,
        url: response.file_url,
        status: 'done',
        progress: 100
    };
}

export function buildPendingDocumentValue(file: File): TerceroDocumentFileValue {
    return {
        path: '',
        name: file.name,
        size: file.size,
        status: 'pending',
        progress: 0,
        objectURL: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    };
}

export function buildExistingDocumentValue(path: string): TerceroDocumentFileValue {
    const normalizedPath = path.replace(/^\/storage\//, '');
    return {
        path: normalizedPath,
        name: normalizedPath.split('/').pop() ?? normalizedPath,
        size: 0,
        url: path.startsWith('http') || path.startsWith('/storage') ? path : `/storage/${normalizedPath}`,
        status: 'done',
        progress: 100
    };
}

export function isDocumentImage(fileVal: TerceroDocumentFileValue | string | null): boolean {
    if (!fileVal) return false;
    if (typeof fileVal !== 'string' && fileVal.objectURL) return true;
    const path = typeof fileVal === 'string' ? fileVal : fileVal.path || fileVal.name || '';
    return /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(path);
}

export function isDocumentPdf(fileVal: TerceroDocumentFileValue | string | null): boolean {
    if (!fileVal) return false;
    const name = typeof fileVal === 'string' ? fileVal : fileVal.name || fileVal.path || '';
    return name.toLowerCase().endsWith('.pdf');
}

export function getDocumentFileUrl(fileVal: TerceroDocumentFileValue | string | null): string {
    if (!fileVal) return '';
    if (typeof fileVal === 'string') {
        return fileVal.startsWith('http') || fileVal.startsWith('/storage') ? fileVal : `/storage/${fileVal}`;
    }
    if (fileVal.objectURL) return fileVal.objectURL;
    if (fileVal.url) {
        return fileVal.url.startsWith('http') || fileVal.url.startsWith('/storage') ? fileVal.url : `/storage/${fileVal.url}`;
    }
    if (fileVal.path) {
        return fileVal.path.startsWith('http') || fileVal.path.startsWith('/storage') ? fileVal.path : `/storage/${fileVal.path}`;
    }
    return '';
}

export function formatDocumentFileSize(bytes: number): string {
    if (!bytes) return 'Subido';
    return `${(bytes / 1024).toFixed(2)} KB`;
}
