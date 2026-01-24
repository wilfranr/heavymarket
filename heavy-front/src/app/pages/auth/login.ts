import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../core/auth/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ButtonModule, CheckboxModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, AppFloatingConfigurator, ToastModule],
    template: `
        <p-toast position="top-right" [life]="5000"></p-toast>
        <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                        <div class="text-center mb-8">
                            <img src="assets/images/logo.svg" alt="CYH Heavy Market" class="mb-8 w-64 shrink-0 mx-auto" />
                            <span class="text-muted-color font-medium">Inicia sesión para continuar</span>
                        </div>

                        <div>
                            <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
                            <input pInputText id="email1" type="email" placeholder="correo@ejemplo.com" class="w-full md:w-120 mb-8" [(ngModel)]="email" />

                            <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Contraseña</label>
                            <p-password id="password1" [(ngModel)]="password" placeholder="Contraseña" [toggleMask]="true" styleClass="mb-4" [fluid]="true" [feedback]="false"></p-password>

                            <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                                <div class="flex items-center">
                                    <p-checkbox [(ngModel)]="checked" id="rememberme1" binary class="mr-2"></p-checkbox>
                                    <label for="rememberme1">Recordarme</label>
                                </div>
                                <span class="font-medium no-underline ml-2 text-right cursor-pointer text-primary">¿Olvidaste tu contraseña?</span>
                            </div>
                            <p-button label="Iniciar Sesión" styleClass="w-full" (onClick)="onLogin()" [loading]="isLoading()"> </p-button>

                            <div class="text-center mt-4">
                                <span class="text-muted-color font-medium">¿No tienes cuenta? </span>
                                <a routerLink="/auth/register" class="font-medium no-underline cursor-pointer text-primary">Regístrate</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class Login {
    private authService = inject(AuthService);
    private router = inject(Router);
    private toastService = inject(ToastService);

    email: string = '';
    password: string = '';
    checked: boolean = false;
    isLoading = signal(false);

    onLogin(): void {
        if (!this.email || !this.password) {
            this.toastService.warning('Por favor ingresa tu email y contraseña');
            return;
        }

        this.isLoading.set(true);

        this.authService.login({ email: this.email, password: this.password }).subscribe({
            next: () => {
                this.isLoading.set(false);
                this.toastService.success('Inicio de sesión exitoso');
                this.router.navigate(['/app']);
            },
            error: (error) => {
                this.isLoading.set(false);

                let errorMessage = 'Error al iniciar sesión. Verifica tus credenciales.';

                // Manejar errores de validación de Laravel (422)
                if (error.status === 422) {
                    if (error.error?.errors) {
                        // Obtener el primer mensaje de error de validación
                        const errors = error.error.errors;
                        const firstErrorKey = Object.keys(errors)[0];
                        if (firstErrorKey && Array.isArray(errors[firstErrorKey])) {
                            errorMessage = errors[firstErrorKey][0] || errorMessage;
                        } else if (typeof errors[firstErrorKey] === 'string') {
                            errorMessage = errors[firstErrorKey];
                        }
                    } else if (error.error?.message) {
                        errorMessage = error.error.message;
                    }
                } else if (error.error?.message) {
                    errorMessage = error.error.message;
                }

                this.toastService.error(errorMessage);
            }
        });
    }
}
