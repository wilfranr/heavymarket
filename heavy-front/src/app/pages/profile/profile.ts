import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/services/auth.service';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { FluidModule } from 'primeng/fluid';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, InputTextModule, PasswordModule, ButtonModule, CardModule, ToastModule, FluidModule],
    templateUrl: './profile.html',
    providers: [MessageService]
})
export class Profile implements OnInit {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private messageService = inject(MessageService);

    profileForm: FormGroup;
    loading = false;

    constructor() {
        this.profileForm = this.fb.group(
            {
                name: ['', [Validators.required, Validators.minLength(3)]],
                email: ['', [Validators.required, Validators.email]],
                password: ['', [Validators.minLength(8)]],
                password_confirmation: ['']
            },
            { validators: this.passwordMatchValidator }
        );
    }

    ngOnInit(): void {
        const user = this.authService.currentUser();
        if (user) {
            this.profileForm.patchValue({
                name: user.name,
                email: user.email
            });
        }
    }

    passwordMatchValidator(g: FormGroup) {
        return g.get('password')?.value === g.get('password_confirmation')?.value ? null : { mismatch: true };
    }

    onSubmit(): void {
        if (this.profileForm.invalid) {
            return;
        }

        this.loading = true;
        const formValue = { ...this.profileForm.value };

        // Si no se proporcionó contraseña, eliminarla del objeto para no enviarla
        if (!formValue.password) {
            delete formValue.password;
            delete formValue.password_confirmation;
        }

        this.authService.updateProfile(formValue).subscribe({
            next: (res) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Perfil actualizado correctamente'
                });
                this.loading = false;
                // Limpiar campos de contraseña
                this.profileForm.patchValue({
                    password: '',
                    password_confirmation: ''
                });
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err.error?.message || 'Error al actualizar el perfil'
                });
                this.loading = false;
            }
        });
    }
}
