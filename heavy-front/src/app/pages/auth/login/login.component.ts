import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../../core/auth/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

/**
 * Componente de Login
 *
 * Página de inicio de sesión usando PrimeNG y siguiendo
 * el diseño del template Sakai.
 */
@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, ButtonModule, CheckboxModule, InputTextModule, PasswordModule, MessageModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);
    private toastService = inject(ToastService);

    // Signals para manejo de estado
    isLoading = signal(false);

    // Formulario reactivo
    loginForm: FormGroup;

    constructor() {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            rememberMe: [false]
        });
    }

    /**
     * Manejar envío del formulario
     */
    onSubmit(): void {
        if (this.loginForm.invalid) {
            this.markFormGroupTouched(this.loginForm);
            this.toastService.warning('Por favor completa todos los campos requeridos');
            return;
        }

        this.isLoading.set(true);

        const { email, password } = this.loginForm.value;

        this.authService.login({ email, password }).subscribe({
            next: (response) => {
                this.isLoading.set(false);
                this.toastService.success('Inicio de sesión exitoso');

                // Redirigir al dashboard o returnUrl
                const returnUrl = this.getReturnUrl();
                this.router.navigate([returnUrl]);
            },
            error: (error) => {
                this.isLoading.set(false);

                const message = error.error?.message || 'Error al iniciar sesión. Verifica tus credenciales.';
                this.toastService.error(message);
            }
        });
    }

    /**
     * Obtener URL de retorno desde query params
     */
    private getReturnUrl(): string {
        // Aquí se podría leer de ActivatedRoute si se necesita
        return '/dashboard';
    }

    /**
     * Marcar todos los campos del formulario como tocados
     */
    private markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach((key) => {
            const control = formGroup.get(key);
            control?.markAsTouched();

            if (control instanceof FormGroup) {
                this.markFormGroupTouched(control);
            }
        });
    }

    /**
     * Verificar si un campo tiene error
     */
    hasError(fieldName: string, errorType: string): boolean {
        const field = this.loginForm.get(fieldName);
        return !!(field?.hasError(errorType) && (field?.dirty || field?.touched));
    }
}
