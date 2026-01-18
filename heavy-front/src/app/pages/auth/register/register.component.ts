import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessagesModule } from 'primeng/messages';
import { Message } from 'primeng/api';
import { AuthService } from '../../../core/auth/services/auth.service';

/**
 * Componente de Registro
 * 
 * Página de registro de nuevos usuarios usando PrimeNG
 * y siguiendo el diseño del template Sakai.
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    CheckboxModule,
    InputTextModule,
    PasswordModule,
    MessagesModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Signals para manejo de estado
  isLoading = signal(false);
  errorMessages = signal<Message[]>([]);

  // Formulario reactivo
  registerForm: FormGroup;

  constructor() {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  /**
   * Validador personalizado para verificar que las contraseñas coincidan
   */
  private passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmation = control.get('password_confirmation');

    if (!password || !confirmation) {
      return null;
    }

    return password.value === confirmation.value ? null : { passwordMismatch: true };
  }

  /**
   * Manejar envío del formulario
   */
  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched(this.registerForm);
      return;
    }

    this.isLoading.set(true);
    this.errorMessages.set([]);

    const { name, email, password, password_confirmation } = this.registerForm.value;

    this.authService.register({
      name,
      email,
      password,
      password_confirmation
    }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        
        // Redirigir al dashboard después del registro exitoso
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading.set(false);
        
        // Manejar errores de validación del backend
        if (error.error?.errors) {
          const errors = error.error.errors;
          const messages: Message[] = [];
          
          Object.keys(errors).forEach(key => {
            errors[key].forEach((msg: string) => {
              messages.push({
                severity: 'error',
                summary: 'Error de validación',
                detail: msg
              });
            });
          });
          
          this.errorMessages.set(messages);
        } else {
          this.errorMessages.set([{
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Error al registrar usuario'
          }]);
        }
      }
    });
  }

  /**
   * Marcar todos los campos del formulario como tocados
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
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
    const field = this.registerForm.get(fieldName);
    return !!(field?.hasError(errorType) && (field?.dirty || field?.touched));
  }

  /**
   * Verificar si las contraseñas no coinciden
   */
  hasPasswordMismatch(): boolean {
    return !!(
      this.registerForm.hasError('passwordMismatch') &&
      this.registerForm.get('password_confirmation')?.touched
    );
  }
}
