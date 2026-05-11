import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LandingService } from '../../../core/services/landing';

@Component({
    selector: 'app-footer-section',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './footer-section.html',
    styles: [
        `
            .cursor-pointer {
                cursor: pointer;
            }
        `
    ]
})
export class FooterSection {
    @Output() openTerms = new EventEmitter<void>();

    // Año dinámico: siempre muestra el año actual
    readonly currentYear = new Date().getFullYear();

    // URLs de redes sociales (actualizar según cuentas oficiales)
    readonly socialLinks = {
        facebook: 'https://www.facebook.com/heavymarketsas',
        youtube: ''
    };

    contactForm: FormGroup;
    isSubmitting = false;
    submitSuccess = false;
    submitError = false;

    constructor(
        private fb: FormBuilder,
        private landingService: LandingService
    ) {
        this.contactForm = this.fb.group({
            nombre_completo: ['', Validators.required],
            empresa: [''],
            correo_electronico: ['', [Validators.required, Validators.email]],
            telefono: [''],
            motivo_consulta: ['', Validators.required],
            acepta_tratamiento_datos: [false, Validators.requiredTrue]
        });
    }

    scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    onSubmit() {
        if (this.contactForm.invalid) {
            this.contactForm.markAllAsTouched();
            return;
        }

        this.isSubmitting = true;
        this.submitError = false;
        this.submitSuccess = false;

        this.landingService.submitContactForm(this.contactForm.value).subscribe({
            next: (res) => {
                this.isSubmitting = false;
                this.submitSuccess = true;
                this.contactForm.reset();
                setTimeout(() => (this.submitSuccess = false), 5000);
            },
            error: (err) => {
                this.isSubmitting = false;
                this.submitError = true;
                console.error(err);
                setTimeout(() => (this.submitError = false), 5000);
            }
        });
    }
}
