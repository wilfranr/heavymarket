import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { MessageService } from 'primeng/api';

import { FabricanteService } from '../../../core/services/fabricante.service';
import { ListaService } from '../../../core/services/lista.service';
import { MaquinaService } from '../../../core/services/maquina.service';
import { SistemaService } from '../../../core/services/sistema.service';
import { MaquinaCreateModalComponent } from './maquina-create-modal.component';

describe('MaquinaCreateModalComponent', () => {
    let component: MaquinaCreateModalComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                FormBuilder,
                { provide: MaquinaService, useValue: {} },
                { provide: FabricanteService, useValue: {} },
                { provide: ListaService, useValue: {} },
                { provide: SistemaService, useValue: {} },
                { provide: MessageService, useValue: { add: () => undefined } }
            ]
        });

        component = TestBed.runInInjectionContext(() => new MaquinaCreateModalComponent());
        (component as any).initForm();
    });

    it('guarda la foto seleccionada por el cargador en el formulario', () => {
        const foto = new File(['foto'], 'maquina.png', { type: 'image/png' });

        component.onFileSelected(foto, 'foto');

        expect(component.createMaquinaForm.get('foto')?.value).toBe(foto);
    });

    it('guarda la foto de placa seleccionada por el cargador en el formulario', () => {
        const fotoId = new File(['placa'], 'placa.png', { type: 'image/png' });

        component.onFileSelected(fotoId, 'fotoId');

        expect(component.createMaquinaForm.get('fotoId')?.value).toBe(fotoId);
    });
});
