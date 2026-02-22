import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { LandingManageService } from '../../services/landing-manage.service';

@Component({
    selector: 'app-contact-leads',
    standalone: true,
    imports: [CommonModule, TableModule, ButtonModule, ToastModule, CheckboxModule, InputTextModule, FormsModule, TooltipModule],
    providers: [MessageService],
    templateUrl: './contact-leads.component.html'
})
export class ContactLeadsComponent implements OnInit {
    leads: any[] = [];
    loading = false;

    constructor(
        private landingManageService: LandingManageService,
        private messageService: MessageService
    ) { }

    ngOnInit() {
        this.loadLeads();
    }

    loadLeads() {
        this.loading = true;
        this.landingManageService.getContactLeads().subscribe({
            next: (data) => {
                this.leads = data.map(lead => ({
                    ...lead,
                    isContacted: lead.estado === 'contactado'
                }));
                this.loading = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los clientes interesados' });
                this.loading = false;
            }
        });
    }

    onContactedChange(lead: any, event: any) {
        const checked = event.checked;
        const newState = checked ? 'contactado' : 'nuevo';

        this.landingManageService.updateContactLeadStatus(lead.id, newState).subscribe({
            next: () => {
                lead.estado = newState;
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Estado actualizado correctamente' });
            },
            error: () => {
                // Revert
                lead.isContacted = !checked;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el estado' });
            }
        });
    }

    getWhatsappUrl(phone: string): string {
        if (!phone) return '#';
        // Remove spaces and special characters for the URL
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        return `https://wa.me/${cleanPhone}`;
    }
}
