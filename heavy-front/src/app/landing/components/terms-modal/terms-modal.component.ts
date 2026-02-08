import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-terms-modal',
    standalone: true,
    imports: [CommonModule, DialogModule, ButtonModule],
    templateUrl: './terms-modal.component.html',
    styleUrl: './terms-modal.component.scss'
})
export class TermsModalComponent {
    @Input() visible: boolean = false;
    @Output() visibleChange = new EventEmitter<boolean>();

    onClose() {
        this.visible = false;
        this.visibleChange.emit(false);
    }
}
