import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ClientAuthService } from '../../../core/services/client-auth.service';

import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { RippleModule } from 'primeng/ripple';

@Component({
    selector: 'app-auth-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, DialogModule, ButtonModule, InputTextModule, PasswordModule, CheckboxModule, RippleModule],
    templateUrl: './auth-modal.component.html',
    styleUrls: ['./auth-modal.component.scss']
})
export class AuthModalComponent {
    @Input() visible: boolean = false;
    @Output() close = new EventEmitter<void>();
    @Output() loginSuccess = new EventEmitter<any>();
    @Output() termsClick = new EventEmitter<void>();

    activeTab: 'login' | 'register' = 'login';
    loginForm: FormGroup;
    registerForm: FormGroup;

    isLoading = signal(false);
    showPassword = false;
    serverErrors: any = {};

    constructor(
        private fb: FormBuilder,
        private authService: ClientAuthService
    ) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required]
        });

        this.registerForm = this.fb.group(
            {
                name: ['', Validators.required],
                email: ['', [Validators.required, Validators.email]],
                password: ['', [Validators.required, Validators.minLength(8)]],
                confirmPassword: ['', Validators.required],
                acceptTerms: [false, Validators.requiredTrue]
            },
            { validators: this.passwordMatchValidator }
        );
    }

    private passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
        const password = control.get('password');
        const confirmPassword = control.get('confirmPassword');
        return password && confirmPassword && password.value !== confirmPassword.value ? { passwordMismatch: true } : null;
    }

    toggleTab(tab: 'login' | 'register') {
        this.activeTab = tab;
        this.serverErrors = {};
    }

    onClose() {
        this.close.emit();
        this.visible = false;
        this.serverErrors = {};
    }

    onSubmitLogin() {
        this.serverErrors = {};
        if (this.loginForm.valid) {
            this.isLoading.set(true);
            this.authService.login(this.loginForm.value).subscribe({
                next: (res) => {
                    this.isLoading.set(false);
                    localStorage.setItem('clientToken', res.token);
                    localStorage.setItem('clientUser', JSON.stringify(res.user));
                    this.loginSuccess.emit(res.user);
                    this.onClose();
                },
                error: (err) => {
                    this.isLoading.set(false);
                    console.error('Login failed', err);
                    this.serverErrors.login = err.error?.message || 'Credenciales inválidas';
                }
            });
        }
    }

    onSubmitRegister() {
        this.serverErrors = {};
        if (this.registerForm.valid) {
            this.isLoading.set(true);
            this.authService
                .register({
                    name: this.registerForm.value.name,
                    email: this.registerForm.value.email,
                    password: this.registerForm.value.password,
                    password_confirmation: this.registerForm.value.confirmPassword
                })
                .subscribe({
                    next: (res) => {
                        this.isLoading.set(false);
                        localStorage.setItem('clientToken', res.token);
                        localStorage.setItem('clientUser', JSON.stringify(res.user));
                        this.loginSuccess.emit(res.user);
                        this.onClose();
                    },
                    error: (err) => {
                        this.isLoading.set(false);
                        console.error('Register failed', err);
                        if (err.status === 422) {
                            this.serverErrors = err.error.errors || { general: err.error.message };
                            // Marcamos los campos con error como tocados para que se vean en la UI
                            Object.keys(this.serverErrors).forEach((key) => {
                                this.registerForm.get(key)?.setErrors({ serverError: true });
                            });
                        } else {
                            this.serverErrors.general = 'Ocurrió un error inesperado. Inténtalo de nuevo.';
                        }
                    }
                });
        } else {
            this.registerForm.markAllAsTouched();
        }
    }

    loginSocial(provider: string) {
        this.authService.getSocialRedirectUrl(provider).subscribe({
            next: (res) => {
                window.location.href = res.url;
            },
            error: (err) => console.error('Social login failed', err)
        });
    }
}
