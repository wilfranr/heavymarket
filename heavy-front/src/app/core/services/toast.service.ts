import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

/**
 * Servicio de notificaciones Toast
 * Envuelve PrimeNG MessageService con métodos convenientes
 */
@Injectable({
    providedIn: 'root'
})
export class ToastService {
    constructor(private messageService: MessageService) {}

    /**
     * Muestra un mensaje de éxito
     */
    success(message: string, title: string = 'Éxito'): void {
        this.messageService.add({
            severity: 'success',
            summary: title,
            detail: message,
            life: 3000
        });
    }

    /**
     * Muestra un mensaje de error
     */
    error(message: string, title: string = 'Error'): void {
        this.messageService.add({
            severity: 'error',
            summary: title,
            detail: message,
            life: 5000
        });
    }

    /**
     * Muestra un mensaje de advertencia
     */
    warning(message: string, title: string = 'Advertencia'): void {
        this.messageService.add({
            severity: 'warn',
            summary: title,
            detail: message,
            life: 4000
        });
    }

    /**
     * Muestra un mensaje informativo
     */
    info(message: string, title: string = 'Información'): void {
        this.messageService.add({
            severity: 'info',
            summary: title,
            detail: message,
            life: 3000
        });
    }

    /**
     * Limpia todos los mensajes
     */
    clear(): void {
        this.messageService.clear();
    }
}
