import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ProviderAuthService } from '../../../core/auth/services/provider-auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { AppFloatingConfigurator } from '../../../layout/component/app.floatingconfigurator';

@Component({
    selector: 'app-provider-login',
    standalone: true,
    imports: [ButtonModule, CheckboxModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, AppFloatingConfigurator, ToastModule],
    template: `
        <p-toast position="top-right" [life]="5000"></p-toast>
        <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, #10b981 10%, rgba(16, 185, 129, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                        <div class="text-center mb-8">
                            <img src="assets/images/logo.svg" alt="CYH Heavy Market" class="mb-8 w-64 shrink-0 mx-auto" />
                            <h2 class="text-emerald-600 font-bold mb-2">Portal de Proveedores</h2>
                            <span class="text-muted-color font-medium">Inicia sesión como socio comercial</span>
                        </div>

                        <div>
                            <label for="email_provider" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email del Proveedor</label>
                            <input pInputText id="email_provider" type="email" placeholder="proveedor@ejemplo.com" class="w-full md:w-120 mb-8" [(ngModel)]="email" (keyup.enter)="onLogin()" />

                            <label for="password_provider" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Contraseña</label>
                            <p-password id="password_provider" [(ngModel)]="password" placeholder="Contraseña" [toggleMask]="true" styleClass="mb-4" [fluid]="true" [feedback]="false" (keyup.enter)="onLogin()"></p-password>

                            <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                                <div class="flex items-center">
                                    <p-checkbox [(ngModel)]="checked" id="remember_provider" binary class="mr-2"></p-checkbox>
                                    <label for="remember_provider">Recordarme</label>
                                </div>
                                <span class="font-medium no-underline ml-2 text-right cursor-pointer text-emerald-600">¿Olvidaste tu contraseña?</span>
                            </div>
                            <p-button label="Ingresar al Portal" severity="success" styleClass="w-full" (onClick)="onLogin()" [loading]="isLoading()"> </p-button>

                            <div class="text-center mt-4">
                                <a routerLink="/auth/login" class="font-medium no-underline cursor-pointer text-primary">Volver al login interno</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class ProviderLogin {
    private providerAuthService = inject(ProviderAuthService);
    private router = inject(Router);
    private toastService = inject(ToastService);

    email: string = '';
    password: string = '';
    checked: boolean = false;
    isLoading = signal(false);

    onLogin(): void {
        if (this.isLoading()) {
            return;
        }

        if (!this.email || !this.password) {
            this.toastService.warning('Por favor ingresa tu email y contraseña');
            return;
        }

        this.isLoading.set(true);

        this.providerAuthService.login({ email: this.email, password: this.password }).subscribe({
            next: () => {
                this.isLoading.set(false);
                this.toastService.success('Bienvenido al Portal de Proveedores');
                this.router.navigate(['/provider/opportunities']);
            },
            error: (error) => {
                this.isLoading.set(false);
                const errorMessage = error.error?.message || 'Error de acceso. Verifique sus credenciales.';
                this.toastService.error(errorMessage);
            }
        });
    }
}
